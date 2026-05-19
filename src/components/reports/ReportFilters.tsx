"use client";

import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Filter,
  RotateCcw,
  LayoutGrid,
  Zap,
  Cpu,
} from "lucide-react";
import {
  subDays,
  subMonths,
  subYears,
  subMinutes,
  subHours,
  format,
} from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ReportFiltersProps {
  viewLevel: "area" | "machine" | "sensor";
  setViewLevel: (level: "area" | "machine" | "sensor") => void;
  dateRange: { from: Date; to: Date };
  setDateRange: (range: { from: Date; to: Date }) => void;
  sensorType: string;
  setSensorType: (type: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onReset: () => void;
}

const timePresets = [
  { label: "Today", getValue: () => ({ from: new Date(), to: new Date() }) },
  {
    label: "Yesterday",
    getValue: () => ({
      from: subDays(new Date(), 1),
      to: subDays(new Date(), 1),
    }),
  },
  {
    label: "This week",
    getValue: () => ({ from: subDays(new Date(), 7), to: new Date() }),
  },
  {
    label: "Last week",
    getValue: () => ({
      from: subDays(new Date(), 14),
      to: subDays(new Date(), 7),
    }),
  },
  {
    label: "This month",
    getValue: () => ({ from: subMonths(new Date(), 1), to: new Date() }),
  },
  {
    label: "Last month",
    getValue: () => ({
      from: subMonths(new Date(), 2),
      to: subMonths(new Date(), 1),
    }),
  },
  {
    label: "This year",
    getValue: () => ({ from: subYears(new Date(), 1), to: new Date() }),
  },
  {
    label: "All time",
    getValue: () => ({ from: subYears(new Date(), 10), to: new Date() }),
  },
];

export default function ReportFilters({
  viewLevel,
  setViewLevel,
  dateRange,
  setDateRange,
  sensorType,
  setSensorType,
  searchQuery,
  setSearchQuery,
  onReset,
}: ReportFiltersProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange, isPopoverOpen]);

  const triggerStyles = cn(
    "w-full justify-start text-left font-normal h-10 px-3",
    "bg-slate-950 border-slate-800 text-slate-200",
    "hover:bg-slate-900 hover:border-slate-700 hover:text-white",
    "transition-all duration-200 active:scale-[0.98]",
    !dateRange && "text-slate-500"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Filters</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-slate-400 hover:text-white hover:bg-slate-800"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">
            Search Entity
          </Label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Date Range Picker */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">
            Time Range
          </Label>

          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className={triggerStyles}>
                {dateRange?.from ? (
                  dateRange.to ? (
                    <span className="text-sm">
                      {format(dateRange.from, "MMM dd, yy")} -{" "}
                      {format(dateRange.to, "MMM dd, yy")}
                    </span>
                  ) : (
                    format(dateRange.from, "MMM dd, yy")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#0b0f1a] border-slate-800 shadow-2xl flex overflow-hidden rounded-xl"
              align="start"
            >
              {/* Sidebar Presets */}
              <div className="w-44 border-r border-slate-800/50 bg-slate-950/40 p-3 flex flex-col gap-0.5">
                {timePresets.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start text-[11px] font-medium h-9 text-slate-500 hover:text-blue-400 hover:bg-blue-500/5 transition-all rounded-lg"
                    )}
                    onClick={() => {
                      setDateRange(preset.getValue());
                      setIsPopoverOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              {/* Main Calendar Area */}
              <div className="flex flex-col bg-slate-950/20">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={localDateRange?.from}
                  selected={{
                    from: localDateRange.from,
                    to: localDateRange.to,
                  }}
                  onSelect={(range: any) => {
                    if (range?.from) {
                      setLocalDateRange({
                        from: range.from,
                        to: range.to || range.from,
                      });
                    }
                  }}
                  numberOfMonths={2}
                />

                {/* Footer Actions & Inputs */}
                <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/50 flex items-center justify-between gap-8">
                  <div className="flex items-center gap-2 flex-1 max-w-[400px]">
                    <div className="flex-1">
                      <input
                        disabled
                        value={
                          localDateRange?.from
                            ? format(localDateRange.from, "MM/dd/yyyy HH:mm")
                            : "Start Date"
                        }
                        className="w-full bg-slate-900/30 border border-slate-800/50 rounded-lg px-3 py-2 text-[11px] text-slate-400 font-mono focus:outline-none"
                      />
                    </div>
                    <span className="text-slate-700 text-xs">—</span>
                    <div className="flex-1">
                      <input
                        disabled
                        value={
                          localDateRange?.to
                            ? format(localDateRange.to, "MM/dd/yyyy HH:mm")
                            : "End Date"
                        }
                        className="w-full bg-slate-900/30 border border-slate-800/50 rounded-lg px-3 py-2 text-[11px] text-slate-400 font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-xs text-slate-500 hover:text-white px-4"
                      onClick={() => setIsPopoverOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg font-bold"
                      onClick={() => {
                        setDateRange(localDateRange);
                        setIsPopoverOpen(false);
                      }}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Sensor Type Filter */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Sensor Categories
          </Label>
          <div className="flex flex-wrap gap-2">
            {["all", "master", "seterline"].map((type) => (
              <Badge
                key={type}
                variant={sensorType === type ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1 capitalize",
                  sensorType === type
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "text-slate-500"
                )}
                onClick={() => setSensorType(type)}
              >
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
