"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Sensor } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getCardBackgroundColor,
  getVibrationColorFromVelocity,
  SensorConfig,
} from "@/lib/utils/vibrationUtils";

interface SensorGroupedDotViewProps {
  sensorGroups?: Sensor[][];
  dotSize?: number;
}

type GroupType = "machine" | "area";

export default function SensorGroupedDotView({
  sensorGroups: propsSensorGroups,
  dotSize = 4,
}: SensorGroupedDotViewProps) {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupType>("machine");

  // Map dotSize to CSS size classes
  const dotSizeClasses: Record<number, string> = {
    1: "w-12 h-12",
    2: "w-14 h-14",
    3: "w-16 h-16",
    4: "w-20 h-20",
  };

  const circleFontSizeMap: Record<number, string> = {
    1: "16px",
    2: "19px",
    3: "23px",
    4: "28px",
  };

  const sizeClass = dotSizeClasses[dotSize] || "w-12 h-12";

  // Flatten sensorGroups to a single array of sensors
  const sensors: Sensor[] = propsSensorGroups ? propsSensorGroups.flat() : [];

  // Group sensors dynamically based on selection
  const groupedData = useMemo(() => {
    const groupsMap = new Map<string, Sensor[]>();

    sensors.forEach((sensor) => {
      let key = "";
      if (groupBy === "machine") {
        key = sensor.machineName || sensor.machine || "Unknown Machine";
      } else {
        key = sensor.area || "Unknown Area";
      }

      if (!groupsMap.has(key)) {
        groupsMap.set(key, []);
      }
      groupsMap.get(key)!.push(sensor);
    });

    const getSensorSeverity = (s: Sensor): number => {
      if (s.status === "lost") return 1;

      const veloRmsH = s.last_data?.velo_rms_h ? Number(s.last_data.velo_rms_h) : 0;
      const veloRmsV = s.last_data?.velo_rms_v ? Number(s.last_data.velo_rms_v) : 0;
      const veloRmsA = s.last_data?.velo_rms_a ? Number(s.last_data.velo_rms_a) : 0;
      const maxRms = Math.max(veloRmsH, veloRmsV, veloRmsA);

      const sensorConfig: SensorConfig = {
        thresholdMin: s.threshold_min ? Number(s.threshold_min) : 0.1,
        thresholdMedium: s.threshold_medium ? Number(s.threshold_medium) : 0.125,
        thresholdMax: s.threshold_max ? Number(s.threshold_max) : 0.15,
        machineClass: s.machine_class || undefined,
      };

      const colorClass = getCardBackgroundColor(maxRms, sensorConfig);

      if (colorClass.includes("bg-[#ff2b05]")) return 4; // Critical (Red)
      if (colorClass.includes("bg-[#ff9900]")) return 3; // Concern (Orange)
      if (colorClass.includes("bg-[#ffff00]")) return 2; // Warning (Yellow)
      return 0; // Normal/Standby
    };

    const getGroupSeverity = (groupSensors: Sensor[]): number => {
      if (groupSensors.length === 0) return 0;
      return Math.max(...groupSensors.map(getSensorSeverity));
    };

    // Sort sensors inside each group: Master first, then severity weight descending
    groupsMap.forEach((groupSensors, key) => {
      const sortedSensors = [...groupSensors].sort((a, b) => {
        const isMasterA = (a.sensor_type || "").toLowerCase() === "master";
        const isMasterB = (b.sensor_type || "").toLowerCase() === "master";

        if (isMasterA && !isMasterB) return -1;
        if (!isMasterA && isMasterB) return 1;

        // Fallback to severity weight
        const sevA = getSensorSeverity(a);
        const sevB = getSensorSeverity(b);
        if (sevA !== sevB) return sevB - sevA;

        // Fallback to serial number/name
        return (a.name || a.sensor_name || "").localeCompare(b.name || b.sensor_name || "");
      });
      groupsMap.set(key, sortedSensors);
    });

    // Convert map to sorted array (Sort by highest severity descending, fallback to alphabetical)
    return Array.from(groupsMap.entries()).sort((a, b) => {
      const severityA = getGroupSeverity(a[1]);
      const severityB = getGroupSeverity(b[1]);

      if (severityA !== severityB) {
        return severityB - severityA;
      }
      return a[0].localeCompare(b[0]);
    });
  }, [sensors, groupBy]);

  const handleSensorClick = (sensorId: string) => {
    router.push(`/sensors/${sensorId}`);
  };

  if (sensors.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <p>No sensors available</p>
      </div>
    );
  }

  // Helper to render a single sensor node (matches SensorDotView exactly)
  const renderSensorNode = (sensor: Sensor) => {
    const role = (sensor.sensor_type || "Satellite").toLowerCase();
    const isMaster = role === "master";

    // Get temperature value
    const temperature = sensor.last_data?.temperature || 0;

    // Determine status color code
    let statusColorCode = "#72ff82"; // Default Normal (Green)

    // Calculate Max RMS and determine status color (Same logic as SensorCard)
    const veloRmsH = sensor.last_data?.velo_rms_h
      ? Number(sensor.last_data.velo_rms_h)
      : 0;
    const veloRmsV = sensor.last_data?.velo_rms_v
      ? Number(sensor.last_data.velo_rms_v)
      : 0;
    const veloRmsA = sensor.last_data?.velo_rms_a
      ? Number(sensor.last_data.velo_rms_a)
      : 0;
    const maxRms = Math.max(veloRmsH, veloRmsV, veloRmsA);

    const sensorConfig: SensorConfig = {
      thresholdMin: sensor.threshold_min ? Number(sensor.threshold_min) : 0.1,
      thresholdMedium: sensor.threshold_medium
        ? Number(sensor.threshold_medium)
        : 0.125,
      thresholdMax: sensor.threshold_max ? Number(sensor.threshold_max) : 0.15,
      machineClass: sensor.machine_class || undefined,
    };

    const colorClass = getCardBackgroundColor(maxRms, sensorConfig);

    // Priority 1: Lost
    if (sensor.status === "lost") {
      statusColorCode = "#404040"; // Lost - Dark Gray
    }
    // Priority 2: Critical (Red)
    else if (colorClass.includes("bg-[#ff2b05]")) {
      statusColorCode = "#ff4d4d"; // Critical
    }
    // Priority 3: Concern (Orange)
    else if (colorClass.includes("bg-[#ff9900]")) {
      statusColorCode = "#ff8c1a"; // Concern
    }
    // Priority 4: Warning (Yellow)
    else if (colorClass.includes("bg-[#ffff00]")) {
      statusColorCode = "#ffd84d"; // Warning
    }
    // Priority 5: Standby
    else if (sensor.status === "standby") {
      statusColorCode = "#f8f8f8"; // Standby - Very Light Gray
    }

    const topSectionStyle: React.CSSProperties = {
      backgroundColor: statusColorCode,
    };

    // Calculate axis colors for tooltip
    const hColor = getVibrationColorFromVelocity(
      veloRmsH,
      sensorConfig,
      "detail",
      sensor.connectivity === "offline"
    );
    const vColor = getVibrationColorFromVelocity(
      veloRmsV,
      sensorConfig,
      "detail",
      sensor.connectivity === "offline"
    );
    const aColor = getVibrationColorFromVelocity(
      veloRmsA,
      sensorConfig,
      "detail",
      sensor.connectivity === "offline"
    );

    // Override axis colors if status is 'lost'
    const finalHColor =
      sensor.status === "lost" ? "bg-[#404040] text-white" : hColor;
    const finalVColor =
      sensor.status === "lost" ? "bg-[#404040] text-white" : vColor;
    const finalAColor =
      sensor.status === "lost" ? "bg-[#404040] text-white" : aColor;

    return (
      <Tooltip key={sensor.id}>
        <TooltipTrigger asChild>
          <div
            className={`${sizeClass} cursor-pointer hover:opacity-80 transition-all duration-500 relative`}
            onClick={() => handleSensorClick(sensor.id)}
          >
            {isMaster ? (
              // Master: Bread Loaf shape
              <div
                className={`${sizeClass} flex flex-col items-center justify-center overflow-hidden`}
              >
                <svg
                  viewBox="0 0 100 110"
                  className="w-full h-full overflow-visible drop-shadow-sm"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M 50 2 C 20 2 2 20 2 50 L 10 108 L 90 108 L 98 50 C 98 20 80 2 50 2 Z"
                    fill={statusColorCode}
                  />
                  <path d="M 8 52 L 92 52 L 85 102 L 15 102 Z" fill="white" />
                  <text
                    x="50"
                    y="82"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={sensor.status === "lost" ? "#404040" : "#000"}
                    fontSize="35"
                    fontWeight="bold"
                    fontFamily="'Inter', sans-serif"
                    className="select-none"
                  >
                    {sensor.status === "lost"
                      ? "-"
                      : `${Math.round(temperature)}°`}
                  </text>
                </svg>
              </div>
            ) : (
              // Satellite: Circle Shape
              <div
                className="w-full h-full rounded-full flex flex-col items-center justify-center overflow-hidden relative"
                style={{
                  backgroundColor: "white",
                  border: `3px solid ${statusColorCode}`,
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[50%]"
                  style={topSectionStyle}
                ></div>
                <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-white"></div>
                <div className="absolute bottom-0 left-0 right-0 h-[50%] z-10 flex items-center justify-center pb-1">
                  <span
                    className={`font-bold leading-none ${sensor.status === "lost" ? "text-[#404040]" : "text-gray-900"}`}
                    style={{
                      fontSize: circleFontSizeMap[dotSize] || "18px",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {sensor.status === "lost"
                      ? "-"
                      : `${Math.round(temperature)}°`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-[#0B1121] border-[1.35px] border-[#374151] text-white p-4 min-w-[200px]"
        >
          <div className="space-y-3 text-base">
            <div>
              <div className="font-bold text-lg leading-tight">
                {sensor.name || sensor.sensor_name || "Unknown Sensor"}
              </div>
              <div className="text-gray-300 text-sm mt-0.5">
                {sensor.machineName || "Unknown Machine"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Temp:</span>
                <span className="font-mono">{temperature.toFixed(0)}°C</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Battery:</span>
                <span className="font-mono">
                  {sensor.batteryLevel?.toFixed(2) ||
                    sensor.last_data?.battery?.toFixed(2) ||
                    "0.00"}
                  %
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-700">
              <span className="text-gray-400">Vibration:</span>
              <div className="flex space-x-2">
                <div
                  className={`w-4 h-4 rounded-full ${finalHColor.split(" ")[0]}`}
                  title="Horizontal (H)"
                />
                <div
                  className={`w-4 h-4 rounded-full ${finalVColor.split(" ")[0]}`}
                  title="Vertical (V)"
                />
                <div
                  className={`w-4 h-4 rounded-full ${finalAColor.split(" ")[0]}`}
                  title="Axial (A)"
                />
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="w-full space-y-6 transition-all duration-300">
      {/* Sleek Segmented Controller at the top */}
      <div className="flex justify-start">
        <div className="flex p-1 bg-[#11171F] border border-gray-800 rounded-lg shadow-inner">
          <button
            onClick={() => setGroupBy("machine")}
            className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${
              groupBy === "machine"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Group by Machine
          </button>
          <button
            onClick={() => setGroupBy("area")}
            className={`px-4 py-1.5 rounded-md text-xs sm:text-sm font-semibold transition-all duration-200 ${
              groupBy === "area"
                ? "bg-blue-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Group by Area
          </button>
        </div>
      </div>

      <TooltipProvider>
        {/* Styled group containers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-6 w-full">
          {groupedData.map(([groupName, groupSensors]) => (
            <div
              key={groupName}
              className="bg-[#11171F]/30 border border-gray-800/80 rounded-xl p-4 sm:p-5 flex flex-col space-y-4 shadow-sm backdrop-blur-[2px]"
            >
              {/* Group Header */}
              <div className="flex justify-between items-center border-b border-gray-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-5 rounded-full bg-blue-500" />
                  <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                    {groupName}
                  </span>
                </div>
                {groupBy === "area" && (
                  <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20">
                    {groupSensors.length} {groupSensors.length === 1 ? "Device" : "Devices"}
                  </span>
                )}
              </div>

              {/* Group Dots */}
              <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start items-center">
                {groupSensors.map((sensor) => renderSensorNode(sensor))}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
