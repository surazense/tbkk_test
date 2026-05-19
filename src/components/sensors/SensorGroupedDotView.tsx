"use client";

import type React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Sensor } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCardBackgroundColor, SensorConfig } from "@/lib/utils/vibrationUtils";
import SensorDotNode from "./SensorDotNode";

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
                {groupSensors.map((sensor) => (
                  <SensorDotNode
                    key={sensor.id}
                    sensor={sensor}
                    dotSize={dotSize}
                    sizeClass={sizeClass}
                    circleFontSizeMap={circleFontSizeMap}
                    handleSensorClick={handleSensorClick}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
}
