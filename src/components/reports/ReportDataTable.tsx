"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  ChevronRight,
  Activity,
  ArrowUpDown,
  Maximize2,
  Clock,
  RotateCcw,
  Battery,
  BatteryWarning,
} from "lucide-react";
import { cn, getDistinctColor } from "@/lib/utils";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ReportDataTableProps {
  viewLevel: "area" | "machine" | "sensor";
  data: any[];
  selectedArea: string | null;
  selectedMachine: string | null;
  sensorType: string;
  dateRange: { from: Date; to: Date };
  comparisonIds: string[];
  onToggleComparison: (id: string) => void;
  onDrillDown: (name: string) => void;
  onGoBack: () => void;
  sortConfig: { key: string; direction: "asc" | "desc" };
  setSortConfig: (config: { key: string; direction: "asc" | "desc" }) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function ReportDataTable({
  viewLevel,
  data,
  selectedArea,
  selectedMachine,
  sensorType,
  dateRange,
  comparisonIds,
  onToggleComparison,
  onDrillDown,
  onGoBack,
  sortConfig,
  setSortConfig,
  searchQuery,
  setSearchQuery,
}: ReportDataTableProps) {
  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(20);
  }, [viewLevel, selectedArea, selectedMachine, sensorType, searchQuery]);

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 20, data.length));
  }, [data.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < data.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMore, visibleCount, data.length]);

  const handleSort = (key: string) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key, direction: "desc" });
    }
  };

  const paginatedData = data.slice(0, visibleCount);

  const formatLostTime = (mins: number) => {
    if (mins < 1) return "Stable";
    if (mins < 60) return `${Math.round(mins)}m`;
    const hours = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${hours}h ${m}m`;
  };

  // Compute a stable list of all possible entity names in this view level
  const allEntityNames = data.map(item => item.name);

  return (
    <div className="bg-transparent flex flex-col">
      {/* Navigation Breadcrumbs */}
      <div className="px-6 py-3 bg-slate-950/20 border-b border-slate-800/50 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onGoBack}
          disabled={viewLevel === "area"}
          className="h-7 text-[10px] gap-1 bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
        >
          Go Back
        </Button>
        <div className="h-4 w-px bg-slate-800" />
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={cn(
              "cursor-pointer transition-colors",
              viewLevel === "area"
                ? "text-blue-400 font-bold"
                : "text-slate-500 hover:text-slate-300"
            )}
            onClick={() => {
              if (viewLevel !== "area") onGoBack();
              if (viewLevel === "sensor") onGoBack();
            }}
          >
            All Areas
          </span>
          {selectedArea && (
            <>
              <span className="mx-2 text-slate-700">/</span>
              <span
                className={cn(
                  "cursor-pointer transition-colors",
                  viewLevel === "machine"
                    ? "text-blue-400 font-bold"
                    : "text-slate-500 hover:text-slate-300"
                )}
                onClick={() => {
                  if (viewLevel === "sensor") onGoBack();
                }}
              >
                {selectedArea}
              </span>
            </>
          )}
          {selectedMachine && (
            <>
              <span className="mx-2 text-slate-700">/</span>
              <span className="text-blue-400 font-bold cursor-default">
                {selectedMachine}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-3 shrink-0">
          <div>
            <h3 className="font-semibold text-white tracking-tight">
              Transmission Details
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">
              Detailed breakdown by {viewLevel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 max-w-md">
          <div className="relative w-full">
            <Input
              placeholder="Quick search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px] relative border-b border-slate-800">
        <Table>
          <TableHeader className="bg-[#0f172a] sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent border-slate-800">
              <TableHead className="w-[50px]"></TableHead>
              <TableHead
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-1">
                  {viewLevel.toUpperCase()} Name
                    <ArrowUpDown
                    size={0}
                    className="hidden"
                  />
                </div>
              </TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4">
                Status
              </TableHead>
              <TableHead
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-right px-6 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort("packets")}
              >
                <div className="flex items-center justify-end gap-1">
                  Packets
                    <ArrowUpDown
                    size={0}
                    className="hidden"
                  />
                </div>
              </TableHead>
              <TableHead
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort("loss")}
              >
                <div className="flex items-center justify-end gap-1">
                  Loss %
                    <ArrowUpDown
                    size={0}
                    className="hidden"
                  />
                </div>
              </TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-center">
                Battery
              </TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-center">
                Max Temp
              </TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-center">
                Max Vib
              </TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-center">
                Alerts
              </TableHead>
              <TableHead
                className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort("uptime")}
              >
                <div className="flex items-center justify-end gap-1">
                  Uptime %
                    <ArrowUpDown
                    size={0}
                    className="hidden"
                  />
                </div>
              </TableHead>
              <TableHead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest py-4 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => {
              const totalPackets = row.totalPackets || 0;
              const onlineCount = row.rawSensors.filter((s: any) => s.connectivity === "online").length;
              const isSelected = comparisonIds.includes(row.id);
              const uptime = row.uptime || 0;
              const lossPercentage = row.lossPercentage || 0;
              
              // Determine color based on stable index in the full data list
              const stableIndex = allEntityNames.indexOf(row.name);
              const rowColor = isSelected ? getDistinctColor(stableIndex >= 0 ? stableIndex : 0) : null;

              return (
                <TableRow
                  key={row.id}
                  style={rowColor ? { backgroundColor: `${rowColor}08` } : {}}
                  className={cn(
                    "border-slate-800/50 hover:bg-slate-800/30 transition-colors group",
                    isSelected && "border-l-2"
                  )}
                >
                  <TableCell className="py-4" style={rowColor ? { borderLeftColor: rowColor } : {}}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleComparison(row.id)}
                      style={rowColor ? { 
                        backgroundColor: isSelected ? rowColor : "transparent",
                        borderColor: isSelected ? rowColor : undefined
                      } : {}}
                      className="border-slate-700 data-[state=checked]:text-slate-900"
                    />
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                       {rowColor && (
                         <div 
                           className="w-1.5 h-6 rounded-full shrink-0" 
                           style={{ backgroundColor: rowColor }} 
                         />
                       )}
                       <div className="flex flex-col">
                         <span className="font-semibold text-slate-200">{row.name}</span>
                         {viewLevel === "sensor" && row.rawSensors[0]?.serialNumber && (
                           <span className="text-[9px] text-blue-400/70 font-mono">
                             SN: {row.rawSensors[0].serialNumber}
                           </span>
                         )}
                         {viewLevel === "sensor" && (
                           <span className="text-[10px] text-slate-500 truncate max-w-[150px]">
                             {row.rawSensors[0]?.sensor_type || "Group"}
                           </span>
                         )}
                       </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          onlineCount > 0
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                            : "bg-slate-600"
                        )}
                      />
                      <span
                        className={cn(
                          "text-xs font-medium",
                          onlineCount > 0 ? "text-green-400" : "text-slate-500"
                        )}
                      >
                        {onlineCount > 0
                          ? viewLevel === "sensor"
                            ? "Online"
                            : `${onlineCount} Active`
                          : "Offline"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 font-mono text-xs text-slate-300 px-6">
                    <div className="flex flex-col items-end">
                       <span>{totalPackets.toLocaleString()}</span>
                       {row.totalExpected > totalPackets && (
                         <span className="text-[9px] text-slate-500">of {row.totalExpected.toLocaleString()}</span>
                       )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    <div className="flex items-center justify-end gap-1.5 text-xs">
                      <span
                        className={cn(
                          "font-medium",
                          lossPercentage > 10 ? "text-rose-400" : lossPercentage > 0 ? "text-amber-400" : "text-green-400"
                        )}
                      >
                        {lossPercentage.toFixed(1)}%
                      </span>
                      {row.lostMins > 0 && (
                        <span className="text-[9px] text-slate-500 ml-1">
                          ({formatLostTime(row.lostMins)})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                    <div className="flex flex-col items-center justify-center">
                       {row.batteryMin != null ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/50 border border-slate-800">
                             <span className={cn("text-[10px] font-mono", row.batteryMin < 20 ? "text-rose-400 font-bold" : "text-slate-300")}>
                                {row.batteryMin.toFixed(0)}%
                             </span>
                          </div>
                       ) : <span className="text-[10px] text-slate-600 font-mono">-</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4">
                     {row.tempMax != null ? (
                       <span className={cn(
                         "text-xs font-mono font-bold px-2 py-0.5 rounded",
                         row.tempMax > 80 ? "text-rose-400 bg-rose-500/10" : "text-amber-400"
                       )}>
                         {row.tempMax.toFixed(1)}°C
                       </span>
                     ) : <span className="text-[10px] text-slate-600 font-mono">-</span>}
                  </TableCell>
                  <TableCell className="text-center py-4">
                     {row.vibMax != null ? (
                       <span className={cn(
                         "text-xs font-mono",
                         row.vibMax > 9.0 ? "text-rose-400 font-bold" : "text-slate-300"
                       )}>
                         {row.vibMax.toFixed(2)}
                       </span>
                     ) : <span className="text-[10px] text-slate-600 font-mono">-</span>}
                  </TableCell>
                  <TableCell className="text-center py-4">
                     {row.alerts != null && row.alerts > 0 ? (
                       <span className="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded-full">
                         {row.alerts}
                       </span>
                     ) : <span className="text-[10px] text-slate-600 font-mono">-</span>}
                  </TableCell>
                  <TableCell className="text-right py-4 font-mono">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-xs font-bold",
                          uptime > 95 ? "text-green-500" : uptime > 80 ? "text-amber-500" : "text-rose-500"
                        )}
                      >
                        {uptime.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden leading-none">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            uptime > 95 ? "bg-green-500" : uptime > 80 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${uptime}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4">
                    {viewLevel !== "sensor" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDrillDown(row.name)}
                        className="h-8 text-[11px] gap-1 text-slate-400 hover:text-white hover:bg-slate-800 group px-2"
                      >
                        Drill Down
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="h-12 flex items-center justify-center border-t border-slate-800/30 bg-slate-900/10">
          {visibleCount < data.length && (
            <div className="flex items-center gap-2 text-slate-500 text-xs animate-pulse">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
              Loading more data...
            </div>
          )}
          {visibleCount >= data.length && data.length > 0 && (
            <div className="text-[10px] text-slate-600 uppercase tracking-widest font-bold py-4">
              End of results ({data.length})
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

