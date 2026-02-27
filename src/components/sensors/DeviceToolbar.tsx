import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Grid3X3, Circle, Search, PlusCircle } from "lucide-react";
import { ViewMode } from "./ViewSelector";

interface DeviceToolbarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onRegisterClick: () => void;
  onDotSizeChange?: (level: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

import { useFolderTree } from "@/components/layout/FolderTreeContext";
import { useAuth } from "@/components/auth/AuthProvider";

const DeviceToolbar: React.FC<DeviceToolbarProps> = ({
  currentView,
  onViewChange,
  onRegisterClick,
  onDotSizeChange,
  searchQuery,
  onSearchChange,
}) => {
  const { setCollapsed } = useFolderTree();
  const { user } = useAuth();

  const handleViewChange = (view: ViewMode) => {
    onViewChange(view);
    setCollapsed(true);
  };

  const [dotSize, setDotSize] = useState<number>(2);

  const canRegister =
    user?.role?.toLowerCase() === "admin" ||
    user?.role?.toLowerCase() === "editor";

  return (
    <>
      {/* ============================================================
          MOBILE layout (< md): 2 rows, no border box
          ============================================================ */}
      <div className="md:hidden py-2 space-y-2">
        {/* Row 1: Title | M/S badges | View toggles | Register */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Title + M/S */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              {currentView === "dot" ? "Dot View" : "Card View"}
            </span>

            {/* M badge */}
            <span title="Master" className="flex items-center shrink-0">
              <div className="w-6 h-6 relative flex items-center justify-center">
                <svg
                  viewBox="0 0 100 110"
                  className="absolute inset-0 w-full h-full overflow-visible"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M 50 2 C 20 2 2 20 2 50 L 10 108 L 90 108 L 98 50 C 98 20 80 2 50 2 Z"
                    fill="#2563eb"
                  />
                </svg>
                <span className="relative z-10 text-white font-bold text-xs leading-none mb-0.5">
                  M
                </span>
              </div>
            </span>

            {/* S badge */}
            <span title="Satellite" className="flex items-center shrink-0">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500 text-white font-bold text-xs">
                S
              </span>
            </span>
          </div>

          {/* Right: View toggles + Register */}
          <div className="flex items-center gap-1.5 shrink-0">
            {currentView === "dot" && (
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={dotSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDotSize(v);
                  if (onDotSizeChange) onDotSizeChange(v);
                }}
                className="w-16 h-2 accent-blue-500"
                aria-label="Dot size"
              />
            )}
            <Button
              size="icon"
              className={`h-8 w-8 ${
                currentView === "grid"
                  ? "bg-[#3758F9] hover:bg-[#3758F9]"
                  : "bg-[#11171F] hover:bg-[#232e3c]"
              } border border-gray-700 text-white`}
              onClick={() => handleViewChange("grid")}
            >
              <Grid3X3 className="h-4 w-4 text-white" />
            </Button>
            <Button
              size="icon"
              className={`h-8 w-8 ${
                currentView === "dot"
                  ? "bg-[#3758F9] hover:bg-[#3758F9]"
                  : "bg-[#11171F] hover:bg-[#232e3c]"
              } border border-gray-700 text-white`}
              onClick={() => handleViewChange("dot")}
            >
              <Circle className="h-4 w-4 text-white" />
            </Button>
            {canRegister && (
              <Button
                size="icon"
                onClick={onRegisterClick}
                className="h-8 w-8 bg-[#11171F] hover:bg-[#1e293b] text-white border border-gray-700 rounded-md shrink-0"
                title="Register Device"
              >
                <PlusCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: Search full width */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by serial number or machine name..."
            className="w-full rounded-lg border border-gray-700 bg-[#11171F] text-white pl-9 pr-3 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* ============================================================
          DESKTOP layout (≥ md): original single-row with border box
          ============================================================ */}
      <div
        className="hidden md:flex flex-wrap justify-between items-center p-3 rounded-xl bg-[#030616] shadow-md text-white border-[1.35px] border-[#374151]"
        style={{ minWidth: 0 }}
      >
        {/* Left: Title + M/S */}
        <div
          className="flex flex-nowrap items-center gap-4 min-w-0 whitespace-nowrap"
          style={{ flex: "1 1 0%", minWidth: 0 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 whitespace-nowrap min-w-0">
            <span className="font-semibold text-lg mr-2 text-white truncate block max-w-[120px] sm:max-w-[180px]">
              {currentView === "dot" ? "Dot View" : "Card View"}
            </span>
          </h2>
          <span title="Master" className="flex items-center gap-2 min-w-0">
            <span className="flex items-center min-w-0">
              <div className="w-8 h-8 relative flex items-center justify-center">
                <svg
                  viewBox="0 0 100 110"
                  className="absolute inset-0 w-full h-full overflow-visible drop-shadow-sm"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <path
                    d="M 50 2 C 20 2 2 20 2 50 L 10 108 L 90 108 L 98 50 C 98 20 80 2 50 2 Z"
                    fill="#2563eb"
                  />
                </svg>
                <span className="relative z-10 text-white font-bold text-lg leading-none mb-1">
                  M
                </span>
              </div>
              <span className="ml-2 text-white text-base truncate hidden sm:block max-w-[80px]">
                : Master
              </span>
            </span>
          </span>
          <span title="Satellite" className="flex items-center gap-2 min-w-0">
            <span className="flex items-center min-w-0">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-lg">
                <span>S</span>
              </span>
              <span className="ml-2 text-white text-base truncate hidden sm:block max-w-[90px]">
                : Satellite
              </span>
            </span>
          </span>
        </div>

        {/* Right: Search + View buttons + Register */}
        <div className="flex items-center gap-2">
          <div
            className={`relative flex-1 min-w-0 ${
              currentView === "dot" ? "max-w-[250px]" : "max-w-[500px]"
            }`}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by serial number or machine name ..."
              className="w-full rounded-md border border-gray-700 bg-[#11171F] text-white pl-9 pr-3 py-2 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-0"
            />
          </div>
          {currentView === "dot" && (
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={dotSize}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDotSize(v);
                if (onDotSizeChange) onDotSizeChange(v);
              }}
              className="w-24 h-2 accent-blue-500"
              aria-label="Dot size"
            />
          )}
          <Button
            className={`${
              currentView === "grid"
                ? "bg-[#3758F9] hover:bg-[#3758F9]"
                : "bg-[#030616] hover:bg-[#232e3c]"
            } border border-gray-700 text-white`}
            onClick={() => handleViewChange("grid")}
          >
            <Grid3X3 className="h-5 w-5 text-white" />
          </Button>
          <Button
            variant={currentView === "dot" ? "secondary" : "ghost"}
            size="icon"
            className={`${
              currentView === "dot"
                ? "bg-[#3758F9] hover:bg-[#3758F9]"
                : "bg-[#030616] hover:bg-[#232e3c]"
            } border border-gray-700 text-white`}
            onClick={() => handleViewChange("dot")}
          >
            <Circle className="h-5 w-5 text-white" />
          </Button>
          {canRegister && (
            <Button
              size="sm"
              onClick={onRegisterClick}
              className="h-9 px-3 sm:h-10 sm:px-4 text-sm sm:text-base bg-[#030616] hover:bg-[#11171F] text-white border border-gray-700 rounded-md shrink-0 flex items-center gap-2 transition-all font-semibold"
            >
              <PlusCircle className="h-5 w-5" />
              Register Device
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default DeviceToolbar;
