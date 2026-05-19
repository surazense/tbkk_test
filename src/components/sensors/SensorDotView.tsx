"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Sensor } from "@/lib/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import SensorPagination from "./SensorPagination";
import SensorDotNode from "./SensorDotNode";

interface SensorDotViewProps {
  sensorGroups?: Sensor[][];
  dotSize?: number;
}

export default function SensorDotView({
  sensorGroups: propsSensorGroups,
  dotSize = 4,
}: SensorDotViewProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 510; // Number of sensors per page

  // Map dotSize to CSS size classes
  const dotSizeClasses: Record<number, string> = {
    1: "w-12 h-12",
    2: "w-14 h-14",
    3: "w-16 h-16",
    4: "w-20 h-20",
  };

  const sizeClass = dotSizeClasses[dotSize] || "w-12 h-12";

  // Flatten sensorGroups to a single array of sensors
  const sensors: Sensor[] = propsSensorGroups ? propsSensorGroups.flat() : [];

  // Calculate pagination
  const totalPages = Math.ceil(sensors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSensors = sensors.slice(startIndex, endIndex);

  const handleSensorClick = (sensorId: string) => {
    router.push(`/sensors/${sensorId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (sensors.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-400">
        <p>No sensors available</p>
      </div>
    );
  }

  return (
    <div className="w-full transition-all duration-300">
      <TooltipProvider>
        {/* Simple Flex Layout (Removed grouping and frames) */}
        <div className="flex flex-wrap gap-2">
          {currentSensors.map((sensor) => (
            <SensorDotNode
              key={sensor.id}
              sensor={sensor}
              dotSize={dotSize}
              sizeClass={sizeClass}
              circleFontSizeMap={{
                1: "16px",
                2: "19px",
                3: "23px",
                4: "28px",
              }}
              handleSensorClick={handleSensorClick}
            />
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8">
          <SensorPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </TooltipProvider>
    </div>
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    refreshSensorData?: () => void;
  }
}
