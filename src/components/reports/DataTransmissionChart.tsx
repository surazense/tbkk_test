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
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

type ChartMetric = "packets" | "battery" | "temp" | "alerts";

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
  loading?: boolean;
}

const getDistinctColor = (index: number) => {
  // Use golden angle approximation to ensure well-distributed unique hues
  const hue = (index * 137.508) % 360;
  // Slightly vary lightness to create even more distinction between adjacent indices
  const lightness = 55 + (index % 3) * 5;
  return `hsl(${hue}, 85%, ${lightness}%)`;
};

export default function DataTransmissionChart({
  viewLevel,
  data,
  entities,
  selectedArea,
  selectedMachine,
  chartMode,
  setChartMode,
  loading,
}: DataTransmissionChartProps) {
  const [activeMetric, setActiveMetric] = useState<ChartMetric>("packets");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const tooltipScroll = tooltipScrollRef.current;
      // If tooltip is scrollable
      if (tooltipScroll && tooltipScroll.scrollHeight > tooltipScroll.clientHeight) {
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
      const filteredPayload = payload.filter((entry: any) => 
        !['bgHealthy', 'bgPartial', 'bgLost'].includes(entry.dataKey) &&
        entry.value !== 0 &&
        entry.value != null
      );

      if (filteredPayload.length === 0) return null;

      const item = data.find(d => d.name === label);
      const status = item?.status;
      const stats = item?._stats;

      return (
        <div className="bg-slate-900/95 backdrop-blur-md p-4 border border-slate-700 shadow-2xl rounded-lg text-xs min-w-[220px]">
          <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
            <div className="flex flex-col">
              <p className="font-bold text-white">{label}</p>
              {stats && activeMetric === "packets" && (
                <p className="text-[10px] text-slate-500">
                  {stats.active} of {stats.total} entities active
                </p>
              )}
            </div>
            {status !== "healthy" && activeMetric === "packets" && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded",
                status === "lost" ? "text-rose-400 bg-rose-500/10" : "text-amber-400 bg-amber-500/10"
              )}>
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
              else if (activeMetric === "packets") displayValue = displayValue.toLocaleString();
              else if (activeMetric === "battery") displayValue = `${displayValue}%`;
              else if (activeMetric === "temp") displayValue = `${displayValue}°C`;
              
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                      <span className="text-slate-200 font-semibold truncate max-w-[140px]">{entry.name.replace(/_(packets|battery|temp|alerts)$/, '')}</span>
                    </div>
                    <span className="font-mono font-bold text-white">{displayValue}</span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {activeMetric === "packets" && filteredPayload.length > 1 && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex justify-between items-center">
               <span className="text-slate-500">
                 Total Packets ({viewLevel === 'area' ? 'All Areas' : viewLevel === 'machine' ? 'All Machines' : 'All Sensors'}):
               </span>
               <span className="text-blue-400 font-bold text-sm">
                 {filteredPayload.reduce((acc: number, cur: any) => acc + (cur.value || 0), 0).toLocaleString()}
               </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const chartData = data.map(d => ({
    ...d,
    bgHealthy: d.status === "healthy" ? 1 : 0,
    bgPartial: d.status === "partial" ? 1 : 0,
    bgLost: d.status === "lost" ? 1 : 0,
  }));

  const renderMetricDataKey = (entity: string) => {
    return `${entity}_${activeMetric}`;
  };

  return (
    <div className="space-y-4 relative">
      {loading && (
        <div className="absolute inset-0 z-10 bg-slate-950/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
           <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-2xl flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span className="text-sm font-medium text-slate-200">Analyzing data...</span>
           </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between gap-4 lg:items-center">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h3 className="font-semibold text-white">
              Data Trends
              <span className="ml-2 text-[10px] font-normal text-slate-500 uppercase tracking-widest px-1.5 py-0.5 bg-slate-800 rounded">
                {viewLevel} level
              </span>
            </h3>
            <p className="text-xs text-slate-500">
               Showing {activeMetric} for {selectedArea || selectedMachine || "selected scope"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Toggles */}
          <div className="flex bg-slate-950/50 border border-slate-800 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("packets")}
              className={cn("h-7 text-[11px] px-3 gap-1.5", activeMetric === "packets" ? "bg-blue-500/20 text-blue-400 hover:text-blue-300 hover:bg-blue-500/30" : "text-slate-400 hover:text-slate-200")}
            >
              <Activity size={12} />
              Transmission
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("battery")}
              className={cn("h-7 text-[11px] px-3 gap-1.5", activeMetric === "battery" ? "bg-green-500/20 text-green-400 hover:text-green-300 hover:bg-green-500/30" : "text-slate-400 hover:text-slate-200")}
            >
              <Battery size={12} />
              Battery
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("temp")}
              className={cn("h-7 text-[11px] px-3 gap-1.5", activeMetric === "temp" ? "bg-amber-500/20 text-amber-400 hover:text-amber-300 hover:bg-amber-500/30" : "text-slate-400 hover:text-slate-200")}
            >
              <Thermometer size={12} />
              Temperature
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveMetric("alerts")}
              className={cn("h-7 text-[11px] px-3 gap-1.5", activeMetric === "alerts" ? "bg-rose-500/20 text-rose-400 hover:text-rose-300 hover:bg-rose-500/30" : "text-slate-400 hover:text-slate-200")}
            >
              <AlertTriangle size={12} />
              Alerts
            </Button>
          </div>

          {activeMetric === "packets" && (
            <div className="flex items-center gap-4 px-3 py-1.5 bg-slate-950/50 rounded-lg border border-slate-800 ml-2">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Healthy</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Partial</span>
               </div>
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/60" />
                  <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Lost</span>
               </div>
            </div>
          )}
        </div>
      </div>

      <div ref={chartContainerRef} className="h-[400px] w-full mt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                dy={10}
            />
            <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={(val) => {
                  if (activeMetric === "packets" && val >= 1000) return `${(val/1000).toFixed(1)}k`;
                  if (activeMetric === "battery") return `${val}%`;
                  if (activeMetric === "temp") return `${val}°C`;
                  return val;
                }}
                domain={activeMetric === "battery" ? [0, 100] : ['auto', 'auto']}
            />
            
            {activeMetric === "packets" && <YAxis yAxisId="statusAxis" hide domain={[0, 1]} />}
            
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: '#1e293b', opacity: 0.2 }} 
              wrapperStyle={{ zIndex: 100 }}
            />
            <Legend 
               wrapperStyle={{ paddingTop: '20px' }}
               iconType="circle"
               formatter={(value) => <span className="text-[11px] text-slate-400 ml-1">{String(value).replace(/_(packets|battery|temp|alerts)$/, '')}</span>}
            />
            
            {activeMetric === "packets" && (
              <>
                <Area yAxisId="statusAxis" dataKey="bgHealthy" fill="#22c55e" fillOpacity={0.05} stroke="none" type="step" isAnimationActive={false} legendType="none" activeDot={false} />
                <Area yAxisId="statusAxis" dataKey="bgPartial" fill="#f59e0b" fillOpacity={0.05} stroke="none" type="step" isAnimationActive={false} legendType="none" activeDot={false} />
                <Area yAxisId="statusAxis" dataKey="bgLost" fill="#f43f5e" fillOpacity={0.05} stroke="none" type="step" isAnimationActive={false} legendType="none" activeDot={false} />
              </>
            )}

            {entities.map((entity, index) => {
              const dataKey = renderMetricDataKey(entity);
              const color = getDistinctColor(index);

              if (activeMetric === "battery") {
                return (
                  <Line 
                    key={entity}
                    type="monotone"
                    dataKey={dataKey} 
                    name={dataKey} 
                    stroke={color}
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0f172a', strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                );
              }

              if (activeMetric === "temp") {
                return (
                  <Area 
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
                  key={entity}
                  dataKey={dataKey} 
                  name={dataKey} 
                  stackId={chartMode === "stacked" ? "a" : undefined} 
                  fill={color} 
                  radius={chartMode === "grouped" || activeMetric !== "packets" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={60}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
