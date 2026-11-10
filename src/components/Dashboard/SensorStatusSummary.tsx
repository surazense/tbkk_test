"use client";

import React, { useState } from "react";
import { cn, formatToThailandTime } from "@/lib/utils";
import { useFolderTreeFilter } from "@/components/auth/AuthWrapper";

export type SensorStatusType =
  | "normal"
  | "warning"
  | "concern"
  | "critical"
  | "standby"
  | "lost";

interface SensorStatusSummaryProps {
  data: {
    total: number;
    lastUpdate: string;
    status: {
      normal: number;
      warning: number;
      concern: number;
      critical: number;
      standby: number;
      lost: number;
    };
  };
  selectedStatuses?: SensorStatusType[];
  onStatusFilterChange?: (selectedStatuses: SensorStatusType[]) => void;
  hideStatusGrid?: boolean;
  /** what is being counted, shown in the titles (default "Sensor") */
  noun?: string;
  /** replaces the default "Select All" action (selecting the whole organization) */
  onSelectAll?: () => void;
  /** drop the Standby box, for things that cannot be on standby (e.g. machines) */
  hideStandby?: boolean;
  /** show every label in Thai (the home page keeps its English labels) */
  thai?: boolean;
}

const statusConfig: Record<
  SensorStatusType,
  {
    textColor: string;
    bgColor: string;
    selectedBgColor: string;
  }
> = {
  normal: {
    textColor: "text-black",
    bgColor: "bg-[#72ff82]",
    selectedBgColor: "bg-[#72ff82]",
  },
  warning: {
    textColor: "text-black",
    bgColor: "bg-[#ffd84d]",
    selectedBgColor: "bg-[#ffd84d]",
  },
  concern: {
    textColor: "text-black",
    bgColor: "bg-[#ff8c1a]",
    selectedBgColor: "bg-[#ff8c1a]",
  },
  critical: {
    textColor: "text-black",
    bgColor: "bg-[#ff4d4d]",
    selectedBgColor: "bg-[#ff4d4d]",
  },
  standby: {
    textColor: "text-black",
    bgColor: "bg-[#f8f8f8]",
    selectedBgColor: "bg-[#f8f8f8]",
  },
  lost: {
    textColor: "text-white",
    bgColor: "bg-[#404040]",
    selectedBgColor: "bg-[#404040]",
  },
};

const SensorStatusSummary: React.FC<SensorStatusSummaryProps> = ({
  data,
  selectedStatuses = [],
  onStatusFilterChange,
  noun = "Sensor",
  onSelectAll,
  hideStandby = false,
  thai = false,
}) => {
  const [internalSelectedStatuses, setInternalSelectedStatuses] =
    useState<SensorStatusType[]>(selectedStatuses);
  const { selectedIds } = useFolderTreeFilter();

  // with a custom "Select All" it reads as selected while no status filter is active
  const isOrganizationSelected = onSelectAll
    ? selectedStatuses.length === 0
    : selectedIds.includes("organization");

  const activeSelectedStatuses =
    onStatusFilterChange !== undefined
      ? selectedStatuses
      : internalSelectedStatuses;

  const handleStatusClick = (status: SensorStatusType) => {
    const newSelected = activeSelectedStatuses.includes(status)
      ? activeSelectedStatuses.filter((s) => s !== status)
      : [...activeSelectedStatuses, status];

    if (onStatusFilterChange) {
      onStatusFilterChange(newSelected);
    } else {
      setInternalSelectedStatuses(newSelected);
    }
  };

  const clearFilters = () => {
    const empty: SensorStatusType[] = [];
    if (onStatusFilterChange) {
      onStatusFilterChange(empty);
    } else {
      setInternalSelectedStatuses(empty);
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  const { status, lastUpdate } = data;
  const lastUpdatedText = formatToThailandTime(new Date(lastUpdate));

  const T = thai
    ? {
        total: "ทั้งหมด",
        updated: "อัปเดต",
        selectAll: "ทั้งหมด",
        clear: "ล้างตัวกรอง",
        clearShort: "ล้าง",
        connected: `${noun}ที่ส่งข้อมูล`,
        connectedSub: `สถานะล่าสุดของ${noun}ทั้งหมด (อัปเดตเมื่อ ${lastUpdatedText})`,
        disconnected: `${noun}ที่ไม่ได้ส่งข้อมูล`,
        placeholder: "-",
        label: {
          normal: "ปกติ",
          warning: "เฝ้าระวัง",
          concern: "เตือน",
          critical: "วิกฤต",
          standby: "สแตนด์บาย",
          lost: "ขาดข้อมูล",
        } as Record<SensorStatusType, string>,
      }
    : {
        total: "Total",
        updated: "Updated",
        selectAll: "Select All",
        clear: "Clear filters",
        clearShort: "Clear",
        connected: `Connected ${noun} Total`,
        connectedSub: `Latest status of all ${noun.toLowerCase()}s (Updated at ${lastUpdatedText})`,
        disconnected: `Disconnected ${noun} Total`,
        placeholder: "Placeholder for alignment",
        label: {
          normal: "normal",
          warning: "warning",
          concern: "concern",
          critical: "critical",
          standby: "standby",
          lost: "lost",
        } as Record<SensorStatusType, string>,
      };

  const connectedTotal =
    status.normal + status.warning + status.concern + status.critical;
  const disconnectedTotal = status.standby + status.lost;

  const allStatuses: SensorStatusType[] = [
    "normal",
    "warning",
    "concern",
    "critical",
    "standby",
    "lost",
  ];

  return (
    <div className="w-full">
      {/* ============================================
          MOBILE: Horizontal Scrollable Pill Row
          ============================================ */}
      <div className="md:hidden">
        {/* Top bar: total count + Select All + Clear */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div>
            <span className="text-xs font-bold text-white">
              {T.total}: {data.total}
            </span>
            <span className="text-[10px] text-gray-400 ml-2">
              {T.updated}{" "}
              {formatToThailandTime(new Date(lastUpdate), {
                day: undefined,
                month: undefined,
                year: undefined,
                second: undefined,
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onSelectAll) {
                  onSelectAll();
                  return;
                }
                window.dispatchEvent(new CustomEvent("SELECT_ORGANIZATION"));
              }}
              className={cn(
                "h-7 px-3 text-xs rounded-md border transition-all duration-200 font-semibold",
                isOrganizationSelected
                  ? "bg-white text-black border-white"
                  : "bg-transparent text-white border-white/40 hover:border-white"
              )}
            >
              {T.selectAll}
            </button>
            {activeSelectedStatuses.length > 0 && (
              <button
                onClick={clearFilters}
                className="h-7 px-2 text-[10px] text-gray-400 hover:text-white underline"
              >
                {T.clearShort} ({activeSelectedStatuses.length})
              </button>
            )}
          </div>
        </div>

        {/* 3x2 Rectangle Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {allStatuses
            .filter((k) => !(hideStandby && k === "standby"))
            .map((key) => {
            const value = status[key];
            const config = statusConfig[key];
            const isSelected = activeSelectedStatuses.includes(key);
            const hasFilterFunction = onStatusFilterChange !== undefined;

            return (
              <button
                key={key}
                onClick={() => hasFilterFunction && handleStatusClick(key)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg border-2 transition-all duration-200 select-none min-h-[52px] w-full",
                  config.bgColor,
                  isSelected
                    ? "border-black shadow-[0_0_10px_rgba(0,0,0,0.5)] scale-[1.03]"
                    : "border-black/30",
                  activeSelectedStatuses.length > 0 &&
                    !isSelected &&
                    "opacity-40 grayscale-[0.4]",
                  hasFilterFunction && "cursor-pointer active:scale-95"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold capitalize leading-none mb-0.5",
                    config.textColor
                  )}
                >
                  {T.label[key]}
                </span>
                <span
                  className={cn(
                    "text-xl font-extrabold leading-none",
                    config.textColor
                  )}
                >
                  {value}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================
          DESKTOP: Original 2-Card Layout
          ============================================ */}
      <div className="hidden md:flex flex-row gap-4">
        {/* Card 1: Connected */}
        <div className="flex-[2] p-2 border-[1px] border-[#374151] rounded-lg bg-[#030616] shadow-md text-white flex flex-col">
          <div className="rounded-md p-0 bg-[#030616] mb-2">
            <div className="flex flex-col sm:flex-row items-start justify-between sm:items-center gap-2">
              <div className="min-h-[44px] sm:min-h-[60px] flex flex-col justify-center">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-white">
                  {T.connected}: {connectedTotal}
                </div>
                <div className="text-[10px] sm:text-xs text-white opacity-80 mt-0.5">
                  {T.connectedSub}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (onSelectAll) {
                      onSelectAll();
                      return;
                    }
                    window.dispatchEvent(
                      new CustomEvent("SELECT_ORGANIZATION")
                    );
                  }}
                  className={cn(
                    "h-[40px] px-6 text-sm rounded-sm border-2 border-white transition-all duration-200 whitespace-nowrap font-bold shadow-[0_0_10px_rgba(255,255,255,0.1)]",
                    isOrganizationSelected
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-black hover:bg-gray-900 text-white"
                  )}
                >
                  {T.selectAll}
                </button>
                {activeSelectedStatuses.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="h-[32px] px-3 text-xs text-muted-foreground hover:text-foreground underline whitespace-nowrap"
                  >
                    {T.clear} ({activeSelectedStatuses.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center flex-1">
            {(
              ["normal", "warning", "concern", "critical"] as SensorStatusType[]
            ).map((key) => {
              const value = status[key];
              const config = statusConfig[key];
              const isSelected = activeSelectedStatuses.includes(key);
              const hasFilterFunction = onStatusFilterChange !== undefined;

              return (
                <div
                  key={key}
                  onClick={() => hasFilterFunction && handleStatusClick(key)}
                  className={cn(
                    "rounded-md bg-card text-card-foreground p-2 flex flex-col justify-center items-center transition-all duration-200 h-full",
                    isSelected ? config.selectedBgColor : config.bgColor,
                    isSelected
                      ? "border-[3px] border-black shadow-[0_8px_25px_rgba(0,0,0,0.9)] scale-105 z-10"
                      : "border-2 border-black",
                    activeSelectedStatuses.length > 0 &&
                      !isSelected &&
                      "opacity-40 scale-95 grayscale-[0.5]",
                    hasFilterFunction &&
                      !isSelected &&
                      "cursor-pointer hover:shadow-md hover:-translate-y-1 hover:scale-105 hover:opacity-100 hover:grayscale-0"
                  )}
                >
                  <div className="flex items-center gap-2 w-full justify-center">
                    <span
                      className={cn(
                        "text-sm md:text-base font-bold capitalize",
                        config.textColor
                      )}
                    >
                      {T.label[key]}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-3xl sm:text-4xl md:text-5xl font-bold leading-none",
                      config.textColor
                    )}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Disconnected */}
        <div className="flex-1 p-2 border-[1px] border-[#374151] rounded-lg bg-[#030616] shadow-md text-white flex flex-col">
          <div className="rounded-md p-0 bg-[#030616] mb-2">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="min-h-[44px] sm:min-h-[60px] flex flex-col justify-center">
                <div className="text-base sm:text-xl md:text-2xl font-bold text-white">
                  {T.disconnected}: {disconnectedTotal}
                </div>
                <div className="text-[10px] sm:text-xs text-transparent select-none mt-0.5">
                  {T.placeholder}
                </div>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "grid gap-2 text-center flex-1",
              hideStandby ? "grid-cols-1" : "grid-cols-2"
            )}
          >
            {(["standby", "lost"] as SensorStatusType[])
              .filter((k) => !(hideStandby && k === "standby"))
              .map((key) => {
              const value = status[key];
              const config = statusConfig[key];
              const isSelected = activeSelectedStatuses.includes(key);
              const hasFilterFunction = onStatusFilterChange !== undefined;

              return (
                <div
                  key={key}
                  onClick={() => hasFilterFunction && handleStatusClick(key)}
                  className={cn(
                    "rounded-md bg-card text-card-foreground p-2 flex flex-col justify-center items-center transition-all duration-200 h-full",
                    isSelected ? config.selectedBgColor : config.bgColor,
                    isSelected
                      ? "border-[3px] border-black shadow-[0_8px_25px_rgba(0,0,0,0.9)] scale-105 z-10"
                      : "border-2 border-black",
                    activeSelectedStatuses.length > 0 &&
                      !isSelected &&
                      "opacity-40 scale-95 grayscale-[0.5]",
                    hasFilterFunction &&
                      !isSelected &&
                      "cursor-pointer hover:shadow-md hover:-translate-y-1 hover:scale-105 hover:opacity-100 hover:grayscale-0"
                  )}
                >
                  <div className="flex items-center gap-2 w-full justify-center">
                    <span
                      className={cn(
                        "text-sm md:text-base font-bold capitalize",
                        config.textColor
                      )}
                    >
                      {T.label[key]}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-3xl sm:text-4xl md:text-5xl font-bold leading-none",
                      config.textColor
                    )}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SensorStatusSummary;
