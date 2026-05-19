"use client";

import { useState, useRef, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CalendarDays,
  WifiOff,
  Activity,
  Battery,
  Thermometer,
  AlertTriangle,
} from "lucide-react";
import { cn, getDistinctColor } from "@/lib/utils";
import { Sensor } from "@/lib/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { subDays, subMonths, subYears, format } from "date-fns";

type ChartMetric = "packets" | "battery" | "temp" | "alerts";

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

interface DataTransmissionChartProps {
  viewLevel: "area" | "machine" | "sensor";
  data: any[];
  entities: string[];
  selectedArea: string | null;
  selectedMachine: string | null;
  chartMode: "stacked" | "grouped";
  setChartMode: (mode: "stacked" | "grouped") => void;
  onDrillDown: (item: string) => void;
  onGoBack: () => void;
  dateRange: { from: Date; to: Date };
  setDateRange?: (range: { from: Date; to: Date }) => void;
  loading?: boolean;
  allEntities?: string[];
  sensors?: Sensor[];
  isComparisonMode?: boolean;
  showSensorDetails?: boolean;
}

export default function DataTransmissionChart({
  viewLevel,
  data,
  entities,
  selectedArea,
  selectedMachine,
  chartMode,
  setChartMode,
  onDrillDown,
  onGoBack,
  dateRange,
  setDateRange,
  loading,
  allEntities = [],
  sensors = [],
  isComparisonMode = false,
  showSensorDetails = false,
}: DataTransmissionChartProps) {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("packets");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState(dateRange);
  const [showStatusBg, setShowStatusBg] = useState(true);

  useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

  const toDatetimeLocal = (d: Date | undefined) => {
    if (!d) return "";
    try {
      const pad = (num: number) => String(num).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (e) {
      return "";
    }
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setTempDateRange((prev) => ({ ...prev, from: d }));
      }
    }
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        setTempDateRange((prev) => ({ ...prev, to: d }));
      }
    }
  };

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const tooltipScroll = tooltipScrollRef.current;
      // If tooltip is scrollable
      if (
        tooltipScroll &&
        tooltipScroll.scrollHeight > tooltipScroll.clientHeight
      ) {
        // Always prevent page scroll when hovering over the chart and tooltip has scrollable data
        e.preventDefault();
        tooltipScroll.scrollTop += e.deltaY;
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const filteredPayload = payload.filter(
        (entry: any) =>
          !["bgHealthy", "bgPartial", "bgLost"].includes(entry.dataKey) &&
          entry.value !== 0 &&
          entry.value != null
      );

      if (filteredPayload.length === 0) return null;

      const item = data.find((d) => d.name === label);
      const status = item?.status;
      const stats = item?._stats;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-4 border border-slate-700 shadow-2xl rounded-lg text-sm min-w-[220px]">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <div className="flex flex-col">
              <p className="font-bold text-white">{label}</p>
              {stats && activeMetric === "packets" && (
                <p className="text-xs text-slate-500">
                  {stats.active} of {stats.total} entities active
                </p>
              )}
            </div>
            {status !== "healthy" && activeMetric === "packets" && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-bold px-1.5 py-0.5 rounded",
                  status === "lost"
                    ? "text-rose-400 bg-rose-500/10"
                    : "text-amber-400 bg-amber-500/10"
                )}
              >
                {status === "lost" ? "LOST DATA" : "PARTIAL DATA"}
              </div>
            )}
          </div>

          <div
            ref={tooltipScrollRef}
            className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar"
          >
            {[...filteredPayload].reverse().map((entry: any, index: number) => {
              let displayValue = entry.value;
              if (displayValue == null) displayValue = "-";
              else if (activeMetric === "packets")
                displayValue = displayValue.toLocaleString();
              else if (activeMetric === "battery")
                displayValue = `${displayValue}%`;
              else if (activeMetric === "temp")
                displayValue = `${displayValue}°C`;

              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-slate-200 font-semibold truncate max-w-[140px]">
                        {entry.name.replace(
                          /_(packets|battery|temp|alerts)$/,
                          ""
                        )}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {displayValue}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {activeMetric === "packets" && filteredPayload.length > 1 && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-slate-500">
                Total Packets (
                {viewLevel === "area"
                  ? "All Areas"
                  : viewLevel === "machine"
                    ? "All Machines"
                    : "All Sensors"}
                ):
              </span>
              <span className="text-blue-400 font-bold text-base">
                {filteredPayload
                  .reduce((acc: number, cur: any) => acc + (cur.value || 0), 0)
                  .toLocaleString()}
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((d) => ({
    ...d,
    bgHealthy: d.status === "healthy" ? 1 : 0,
    bgPartial: d.status === "partial" ? 1 : 0,
    bgLost: d.status === "lost" ? 1 : 0,
  }));

  const renderMetricDataKey = (entity: string) => {
    return `${entity}_${activeMetric}`;
  };

  const getSensorColor = (entity: string) => {
    const actualSensor = sensors.find(
      (s) => s.name === entity || s.serialNumber === entity
    );
    const isMaster = actualSensor
      ? (actualSensor.sensor_type || "").toLowerCase() === "master"
      : entity.toLowerCase().includes("master");

    let colorIndex = 0;
    if (isMaster) {
      colorIndex = 0;
    } else {
      const lower = entity.toLowerCase();
      if (
        lower.includes("satellite 1") ||
        lower.includes("sat 1") ||
        lower.includes("motor1") ||
        lower.includes("sensor 1")
      ) {
        colorIndex = 1;
      } else if (
        lower.includes("satellite 2") ||
        lower.includes("sat 2") ||
        lower.includes("motor2") ||
        lower.includes("sensor 2")
      ) {
        colorIndex = 2;
      } else if (
        lower.includes("satellite 3") ||
        lower.includes("sat 3") ||
        lower.includes("motor3") ||
        lower.includes("sensor 3")
      ) {
        colorIndex = 3;
      } else if (
        lower.includes("satellite 4") ||
        lower.includes("sat 4") ||
        lower.includes("motor4") ||
        lower.includes("sensor 4")
      ) {
        colorIndex = 4;
      } else {
        const masterEntity = entities.find((ent) => {
          const match = sensors.find(
            (s) => s.name === ent || s.serialNumber === ent
          );
          return match
            ? (match.sensor_type || "").toLowerCase() === "master"
            : ent.toLowerCase().includes("master");
        });

        const stableIndex = allEntities.indexOf(entity);

        if (masterEntity) {
          const nonMasterSeq = entities.filter((ent) => {
            const m = sensors.find(
              (s) => s.name === ent || s.serialNumber === ent
            );
            const isM = m
              ? (m.sensor_type || "").toLowerCase() === "master"
              : ent.toLowerCase().includes("master");
            return !isM;
          });
          const seqIdx = nonMasterSeq.indexOf(entity);
          colorIndex =
            seqIdx >= 0
              ? seqIdx + 1
              : stableIndex >= 0
                ? stableIndex + 1
                : entities.indexOf(entity) + 1;
        } else {
          colorIndex =
            stableIndex >= 0 ? stableIndex + 1 : entities.indexOf(entity) + 1;
        }
      }
    }
    return getDistinctColor(colorIndex);
  };

  const getDistinctColorForEntity = (entity: string) => {
    if (viewLevel === "sensor") {
      return getSensorColor(entity);
    }
    const stableIndex = allEntities.indexOf(entity);
    const colorIndex = stableIndex >= 0 ? stableIndex : entities.indexOf(entity);
    return getDistinctColor(colorIndex);
  };

  const renderSingleEntityChart = (singleEntity: string) => {
    const matchingSensors =
      viewLevel === "machine" && showSensorDetails
        ? (sensors || []).filter((s) => s.machineName === singleEntity)
        : [];

    if (matchingSensors.length > 0) {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#1e293b"
              opacity={0.3}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 500 }}
              dy={5}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 500 }}
              tickFormatter={(val) => {
                if (activeMetric === "packets" && val >= 1000)
                  return `${(val / 1000).toFixed(1)}k`;
                if (activeMetric === "battery") return `${val}%`;
                if (activeMetric === "temp") return `${val}°C`;
                return val;
              }}
              domain={activeMetric === "battery" ? [0, 100] : ["auto", "auto"]}
            />

            {activeMetric === "packets" && (
              <YAxis yAxisId="statusAxis" hide domain={[0, 1]} />
            )}

            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#1e293b", opacity: 0.2 }}
              wrapperStyle={{ zIndex: 100 }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: 11,
                fontWeight: 600,
                color: "#cbd5e1",
                paddingBottom: 10,
              }}
            />

            {activeMetric === "packets" && (
              <>
                <Area
                  yAxisId="statusAxis"
                  dataKey="bgHealthy"
                  fill="#22c55e"
                  fillOpacity={0.03}
                  stroke="none"
                  type="step"
                  isAnimationActive={false}
                  legendType="none"
                  activeDot={false}
                />
                <Area
                  yAxisId="statusAxis"
                  dataKey="bgPartial"
                  fill="#f59e0b"
                  fillOpacity={0.03}
                  stroke="none"
                  type="step"
                  isAnimationActive={false}
                  legendType="none"
                  activeDot={false}
                />
                <Area
                  yAxisId="statusAxis"
                  dataKey="bgLost"
                  fill="#f43f5e"
                  fillOpacity={0.03}
                  stroke="none"
                  type="step"
                  isAnimationActive={false}
                  legendType="none"
                  activeDot={false}
                />
              </>
            )}

            {matchingSensors.map((sObj, idx) => {
              const sensorName = sObj.name || sObj.serialNumber;
              const sensorDataKey = renderMetricDataKey(sensorName);
              const sensorColor = getSensorColor(sensorName);

              if (activeMetric === "battery") {
                return (
                  <Line
                    key={sensorName}
                    type="monotone"
                    dataKey={sensorDataKey}
                    name={sensorName}
                    stroke={sensorColor}
                    strokeWidth={2}
                    dot={{ r: 2, fill: "#0f172a", strokeWidth: 1 }}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                );
              }

              if (activeMetric === "temp") {
                return (
                  <Area
                    key={sensorName}
                    type="monotone"
                    dataKey={sensorDataKey}
                    name={sensorName}
                    stroke={sensorColor}
                    fill={sensorColor}
                    fillOpacity={0.1}
                    strokeWidth={1.5}
                  />
                );
              }

              return (
                <Bar
                  key={sensorName}
                  dataKey={sensorDataKey}
                  name={sensorName}
                  stackId="a"
                  fill={sensorColor}
                  radius={[0, 0, 0, 0]}
                  maxBarSize={30}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    const dataKey = renderMetricDataKey(singleEntity);
    const color = getDistinctColorForEntity(singleEntity);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
          barCategoryGap={0}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#1e293b"
            opacity={0.3}
          />
          <XAxis
            xAxisId="dataAxis"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 500 }}
            dy={5}
            padding={{ left: 30, right: 30 }}
          />
          <XAxis
            xAxisId="bgAxis"
            dataKey="name"
            hide
            orientation="top"
            padding={{ left: 0, right: 0 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 500 }}
            tickFormatter={(val) => {
              if (activeMetric === "packets" && val >= 1000)
                return `${(val / 1000).toFixed(1)}k`;
              if (activeMetric === "battery") return `${val}%`;
              if (activeMetric === "temp") return `${val}°C`;
              return val;
            }}
            domain={activeMetric === "battery" ? [0, 100] : ["auto", "auto"]}
          />

          {activeMetric === "packets" && (
            <YAxis yAxisId="statusAxis" hide domain={[0, 1]} />
          )}

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "#1e293b", opacity: 0.2 }}
            wrapperStyle={{ zIndex: 100 }}
          />

          {activeMetric === "packets" && showStatusBg && (
            <>
              <Bar
                xAxisId="bgAxis"
                yAxisId="statusAxis"
                dataKey="bgHealthy"
                fill="#22c55e"
                fillOpacity={0.18}
                stackId="bgStatusStack"
                isAnimationActive={false}
                legendType="none"
              />
              <Bar
                xAxisId="bgAxis"
                yAxisId="statusAxis"
                dataKey="bgPartial"
                fill="#f59e0b"
                fillOpacity={0.18}
                stackId="bgStatusStack"
                isAnimationActive={false}
                legendType="none"
              />
              <Bar
                xAxisId="bgAxis"
                yAxisId="statusAxis"
                dataKey="bgLost"
                fill="#f43f5e"
                fillOpacity={0.18}
                stackId="bgStatusStack"
                isAnimationActive={false}
                legendType="none"
              />
            </>
          )}

          {activeMetric === "battery" && (
            <Line
              xAxisId="dataAxis"
              type="monotone"
              dataKey={dataKey}
              name={singleEntity}
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#0f172a", strokeWidth: 1.5 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          )}

          {activeMetric === "temp" && (
            <Area
              xAxisId="dataAxis"
              type="monotone"
              dataKey={dataKey}
              name={singleEntity}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          )}

          {(activeMetric === "packets" || activeMetric === "alerts") && (
            <Bar
              xAxisId="dataAxis"
              dataKey={dataKey}
              name={singleEntity}
              fill={color}
              radius={[3, 3, 0, 0]}
              maxBarSize={30}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-2xl flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-slate-200">
              Analyzing data...
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full mb-4 gap-4 border-b border-slate-800/40 pb-4">
        {/* Left Side: Title & Info */}
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Data Trends
            <span className="text-xs font-normal text-slate-500 uppercase tracking-widest px-1.5 py-0.5 bg-slate-800 rounded">
              {viewLevel} level
            </span>
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs text-slate-500">
              Showing {activeMetric} for{" "}
              <span className="text-slate-300 font-semibold">
                {selectedArea || selectedMachine || "selected scope"}
              </span>
            </p>
            {activeMetric === "packets" && !showSensorDetails && (
              <div 
                onClick={() => setShowStatusBg(!showStatusBg)}
                className={cn(
                  "flex items-center gap-2.5 p-1 px-2.5 bg-slate-950/60 rounded-lg border shrink-0 select-none cursor-pointer transition-all active:scale-95",
                  showStatusBg 
                    ? "border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-900/60" 
                    : "border-slate-800/40 opacity-40 hover:opacity-60"
                )}
                title={showStatusBg ? "Click to hide all status background colors in the chart" : "Click to show all status background colors in the chart"}
              >
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    showStatusBg ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-slate-500 shadow-none"
                  )} />
                  <span className={cn(
                    "text-[11px] uppercase font-bold tracking-tight transition-colors",
                    showStatusBg ? "text-slate-300" : "text-slate-500 line-through"
                  )}>
                    Healthy
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    showStatusBg ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-slate-500 shadow-none"
                  )} />
                  <span className={cn(
                    "text-[11px] uppercase font-bold tracking-tight transition-colors",
                    showStatusBg ? "text-slate-300" : "text-slate-500 line-through"
                  )}>
                    Partial
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    showStatusBg ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" : "bg-slate-500 shadow-none"
                  )} />
                  <span className={cn(
                    "text-[11px] uppercase font-bold tracking-tight transition-colors",
                    showStatusBg ? "text-slate-300" : "text-slate-500 line-through"
                  )}>
                    Lost
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Metric Toggles and In-Pill Date Picker */}
        <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
          <div 
            className="flex items-center bg-slate-950/50 border border-slate-800 rounded-lg p-1 overflow-x-auto max-w-full gap-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Integrated Date Picker inside the same container (Far Left) */}
            {setDateRange ? (
              <Popover open={isPopoverOpen} onOpenChange={(open) => {
                setIsPopoverOpen(open);
                if (open) {
                  setTempDateRange(dateRange);
                }
              }}>
                <PopoverTrigger asChild>
                  <button className="h-7 text-xs px-2.5 gap-1.5 flex items-center text-blue-400 hover:text-blue-300 font-semibold font-mono hover:bg-slate-900 rounded-md transition-all active:scale-[0.98] shrink-0 select-none">
                    <CalendarDays size={12} className="text-blue-400" />
                    {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 bg-[#0b0f1a] border-slate-800 shadow-2xl flex overflow-hidden rounded-xl z-50"
                  align="start"
                >
                  {/* Sidebar Presets */}
                  <div className="w-44 border-r border-slate-800/50 bg-slate-950/40 p-3 flex flex-col gap-1">
                    {timePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="ghost"
                        size="sm"
                        className="justify-start text-xs sm:text-[13px] text-slate-400 hover:text-white hover:bg-slate-900 h-9 font-medium rounded-md px-3"
                        onClick={() => {
                          const range = preset.getValue();
                          setTempDateRange(range);
                        }}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>

                  {/* Calendar Picker Area */}
                  <div className="flex flex-col bg-[#0b0f1a]">
                    <Calendar
                      mode="range"
                      defaultMonth={tempDateRange?.from}
                      selected={{
                        from: tempDateRange.from,
                        to: tempDateRange.to,
                      }}
                      onSelect={(range: any) => {
                        if (range?.from) {
                          setTempDateRange({
                            from: range.from,
                            to: range.to || range.from,
                          });
                        }
                      }}
                      numberOfMonths={2}
                      classNames={{
                        day: "h-10 w-10 p-0 text-sm font-normal text-slate-400 hover:bg-slate-800 hover:text-white aria-selected:opacity-100 transition-all rounded-md flex items-center justify-center cursor-pointer",
                        weekday: "text-slate-500 w-10 font-semibold text-xs uppercase text-center",
                        selected: "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white font-bold !rounded-md h-10 w-10",
                        range_middle: "aria-selected:bg-blue-600/20 aria-selected:text-blue-300 font-medium !rounded-none h-10 w-10",
                        today: "text-blue-400 font-bold bg-blue-400/10 rounded-md h-10 w-10",
                      }}
                    />

                    {/* Footer Actions & Inputs */}
                    <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 max-w-[480px]">
                        <div className="flex-1">
                          <input
                            type="datetime-local"
                            value={toDatetimeLocal(tempDateRange?.from)}
                            onChange={handleFromChange}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                          />
                        </div>
                        <span className="text-slate-600 text-sm font-bold shrink-0">—</span>
                        <div className="flex-1">
                          <input
                            type="datetime-local"
                            value={toDatetimeLocal(tempDateRange?.to)}
                            onChange={handleToChange}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold font-mono text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 text-xs sm:text-sm text-slate-400 hover:text-white px-4 hover:bg-slate-900 rounded-lg font-medium"
                          onClick={() => setIsPopoverOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          className="h-10 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg font-bold shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all"
                          onClick={() => {
                            if (setDateRange) {
                              setDateRange(tempDateRange);
                            }
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
            ) : (
              <span className="text-slate-500 font-mono text-xs px-2 shrink-0 select-none">
                {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
              </span>
            )}

            {/* Vertical Divider */}
            <div className="h-4 w-[1px] bg-[#374151] mx-1 shrink-0 self-center" />

            {/* Metric Buttons */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("packets")}
              className={cn(
                "h-7 text-xs px-3 gap-1.5 flex-shrink-0",
                activeMetric === "packets"
                  ? "bg-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Activity size={12} />
              Transmission
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("battery")}
              className={cn(
                "h-7 text-xs px-3 gap-1.5 flex-shrink-0",
                activeMetric === "battery"
                  ? "bg-green-500/20 text-green-400 hover:text-green-300 hover:bg-green-500/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Battery size={12} />
              Battery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("temp")}
              className={cn(
                "h-7 text-xs px-3 gap-1.5 flex-shrink-0",
                activeMetric === "temp"
                  ? "bg-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Thermometer size={12} />
              Temperature
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("alerts")}
              className={cn(
                "h-7 text-xs px-3 gap-1.5 flex-shrink-0",
                activeMetric === "alerts"
                  ? "bg-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/30"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <AlertTriangle size={12} />
              Alerts
            </Button>
          </div>
        </div>
      </div>
      {isComparisonMode ? (
        entities.length === 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div className="flex flex-col bg-slate-950/20 border border-slate-800/40 p-3 sm:p-5 rounded-xl backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: getDistinctColorForEntity(entities[0]),
                  }}
                />
                {entities[0]}
              </h4>
              <div className="h-[220px] sm:h-[380px] w-full relative">
                {renderSingleEntityChart(entities[0])}
              </div>


            </div>
            <div className="flex flex-col bg-slate-950/20 border border-slate-800/40 p-3 sm:p-5 rounded-xl backdrop-blur-sm">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: getDistinctColorForEntity(entities[1]),
                  }}
                />
                {entities[1]}
              </h4>
              <div className="h-[220px] sm:h-[380px] w-full relative">
                {renderSingleEntityChart(entities[1])}
              </div>


            </div>
          </div>
        ) : (
          <div className="h-[280px] sm:h-[400px] w-full mt-4 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl bg-slate-950/10 backdrop-blur-sm p-6 text-center">
            <div className="w-12 h-12 sm:w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3 sm:mb-4 text-blue-400">
              <Activity className="w-6 h-6 sm:w-8 h-8 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
              Dual Chart Comparison
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-4">
              Please select exactly{" "}
              <strong className="text-blue-400">2 items</strong> from the table
              below using the checkboxes to generate a side-by-side comparative
              analysis.
            </p>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Currently selected:</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {entities.length} / 2
              </span>
            </div>
          </div>
        )
      ) : (
        <div ref={chartContainerRef} className="h-[280px] sm:h-[500px] w-full mt-4 relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
              barCategoryGap={0}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#1e293b"
                opacity={0.3}
              />
              <XAxis
                xAxisId="dataAxis"
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 500 }}
                dy={5}
                padding={{ left: 30, right: 30 }}
              />
              <XAxis
                xAxisId="bgAxis"
                dataKey="name"
                hide
                orientation="top"
                padding={{ left: 0, right: 0 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 500 }}
                tickFormatter={(val) => {
                  if (activeMetric === "packets" && val >= 1000)
                    return `${(val / 1000).toFixed(1)}k`;
                  if (activeMetric === "battery") return `${val}%`;
                  if (activeMetric === "temp") return `${val}°C`;
                  return val;
                }}
                domain={
                  activeMetric === "battery" ? [0, 100] : ["auto", "auto"]
                }
              />

              {activeMetric === "packets" && (
                <YAxis yAxisId="statusAxis" hide domain={[0, 1]} />
              )}

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#1e293b", opacity: 0.2 }}
                wrapperStyle={{ zIndex: 100 }}
              />
              <Legend
                verticalAlign="bottom"
                height={55}
                iconSize={8}
                wrapperStyle={{
                  fontSize: 10,
                  paddingTop: "15px",
                  overflowY: "auto",
                  maxHeight: "55px",
                  zIndex: 20
                }}
                formatter={(value) => (
                  <span className="text-[11px] text-slate-300 font-medium ml-1">
                    {String(value).replace(
                      /_(packets|battery|temp|alerts)$/,
                      ""
                    )}
                  </span>
                )}
              />

              {activeMetric === "packets" && showStatusBg && (
                <>
                  <Bar
                    xAxisId="bgAxis"
                    yAxisId="statusAxis"
                    dataKey="bgHealthy"
                    fill="#22c55e"
                    fillOpacity={0.18}
                    stackId="bgStatusStack"
                    isAnimationActive={false}
                    legendType="none"
                  />
                  <Bar
                    xAxisId="bgAxis"
                    yAxisId="statusAxis"
                    dataKey="bgPartial"
                    fill="#f59e0b"
                    fillOpacity={0.18}
                    stackId="bgStatusStack"
                    isAnimationActive={false}
                    legendType="none"
                  />
                  <Bar
                    xAxisId="bgAxis"
                    yAxisId="statusAxis"
                    dataKey="bgLost"
                    fill="#f43f5e"
                    fillOpacity={0.18}
                    stackId="bgStatusStack"
                    isAnimationActive={false}
                    legendType="none"
                  />
                </>
              )}

              {entities.map((entity) => {
                const dataKey = renderMetricDataKey(entity);
                const stableIndex = allEntities.indexOf(entity);

                // Determine consistent color index based on sensor roles/types
                let colorIndex =
                  stableIndex >= 0 ? stableIndex : entities.indexOf(entity);
                if (viewLevel === "sensor") {
                  // Look up actual sensor metadata from passed sensors list
                  const actualSensor = sensors.find(
                    (s) => s.name === entity || s.serialNumber === entity
                  );

                  const isMaster = actualSensor
                    ? (actualSensor.sensor_type || "").toLowerCase() ===
                      "master"
                    : entity.toLowerCase().includes("master");

                  if (isMaster) {
                    colorIndex = 0; // Emerald Green
                  } else {
                    const lower = entity.toLowerCase();
                    if (
                      lower.includes("satellite 1") ||
                      lower.includes("sat 1") ||
                      lower.includes("motor1") ||
                      lower.includes("sensor 1")
                    ) {
                      colorIndex = 1; // Sleek Blue
                    } else if (
                      lower.includes("satellite 2") ||
                      lower.includes("sat 2") ||
                      lower.includes("motor2") ||
                      lower.includes("sensor 2")
                    ) {
                      colorIndex = 2; // Modern Violet
                    } else if (
                      lower.includes("satellite 3") ||
                      lower.includes("sat 3") ||
                      lower.includes("motor3") ||
                      lower.includes("sensor 3")
                    ) {
                      colorIndex = 3; // Warm Amber
                    } else if (
                      lower.includes("satellite 4") ||
                      lower.includes("sat 4") ||
                      lower.includes("motor4") ||
                      lower.includes("sensor 4")
                    ) {
                      colorIndex = 4; // Premium Cyan
                    } else {
                      // For custom satellite names (like Blowers/Pumps) that are not the Master:
                      // Shift the index so that they get a distinct non-green color.
                      const masterEntity = entities.find((ent) => {
                        const match = sensors.find(
                          (s) => s.name === ent || s.serialNumber === ent
                        );
                        return match
                          ? (match.sensor_type || "").toLowerCase() === "master"
                          : ent.toLowerCase().includes("master");
                      });

                      if (masterEntity) {
                        const nonMasterSeq = entities.filter((ent) => {
                          const m = sensors.find(
                            (s) => s.name === ent || s.serialNumber === ent
                          );
                          const isM = m
                            ? (m.sensor_type || "").toLowerCase() === "master"
                            : ent.toLowerCase().includes("master");
                          return !isM;
                        });
                        const seqIdx = nonMasterSeq.indexOf(entity);
                        colorIndex =
                          seqIdx >= 0
                            ? seqIdx + 1
                            : stableIndex >= 0
                              ? stableIndex + 1
                              : entities.indexOf(entity) + 1;
                      } else {
                        colorIndex =
                          stableIndex >= 0
                            ? stableIndex + 1
                            : entities.indexOf(entity) + 1;
                      }
                    }
                  }
                }
                const color = getDistinctColor(colorIndex);

                if (activeMetric === "battery") {
                  return (
                    <Line
                      xAxisId="dataAxis"
                      key={entity}
                      type="monotone"
                      dataKey={dataKey}
                      name={dataKey}
                      stroke={color}
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#0f172a", strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  );
                }

                if (activeMetric === "temp") {
                  return (
                    <Area
                      xAxisId="dataAxis"
                      key={entity}
                      type="monotone"
                      dataKey={dataKey}
                      name={dataKey}
                      stroke={color}
                      fill={color}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  );
                }

                // Packets and Alerts use Bar
                return (
                  <Bar
                    xAxisId="dataAxis"
                    key={entity}
                    dataKey={dataKey}
                    name={dataKey}
                    stackId={chartMode === "stacked" ? "a" : undefined}
                    fill={color}
                    radius={
                      chartMode === "grouped" || activeMetric !== "packets"
                        ? [3, 3, 0, 0]
                        : [0, 0, 0, 0]
                    }
                    maxBarSize={60}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
