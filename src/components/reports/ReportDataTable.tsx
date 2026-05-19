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
import { toPng } from "html-to-image";

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
  isComparisonMode?: boolean;
  onToggleComparisonMode?: () => void;
  showSensorDetails?: boolean;
  onToggleSensorDetails?: () => void;
  timeSeriesData?: any[];
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
  isComparisonMode = false,
  onToggleComparisonMode = () => {},
  showSensorDetails = false,
  onToggleSensorDetails = () => {},
  timeSeriesData = [],
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

  const handleExportExcel = async () => {
    const title = `${viewLevel.toUpperCase()} Transmission Report (${selectedArea || "All Areas"}${selectedMachine ? ` - ${selectedMachine}` : ""})`;
    const dateStr = `${dateRange.from.toLocaleDateString()} to ${dateRange.to.toLocaleDateString()}`;
    
    // Generate a high-resolution, professional Chart.js line chart using QuickChart HTTPS API
    // This is 100% natively supported and beautifully rendered by Microsoft Excel!
    let chartImagesHtml = "";
    if (timeSeriesData && timeSeriesData.length > 0) {
      try {
        const comparisonEntities = data.filter(row => row.id && comparisonIds.includes(row.id));
        const activeEntities = comparisonEntities.length > 0 ? comparisonEntities : [data[0]];
        
        const labels = timeSeriesData.map(point => point.name);
        const datasets = activeEntities.map((ent, idx) => {
          const color = idx === 0 ? "#0d9488" : idx === 1 ? "#0284c7" : "#7c3aed";
          const dataPoints = timeSeriesData.map(point => point[`${ent.name}_packets`] || 0);
          return {
            label: ent.name,
            data: dataPoints,
            borderColor: color,
            backgroundColor: color + "cc", // Semi-solid color fill for bar chart
            borderWidth: 1
          };
        });
        
        const chartConfig = {
          type: "bar",
          data: {
            labels: labels,
            datasets: datasets
          },
          options: {
            title: {
              display: true,
              text: `Data Transmission packets over Time (${viewLevel.toUpperCase()})`,
              fontSize: 15,
              fontColor: "#f8fafc"
            },
            legend: {
              labels: {
                fontColor: "#f8fafc"
              }
            },
            scales: {
              xAxes: [{
                gridLines: { color: "#334155" },
                ticks: { fontColor: "#94a3b8" }
              }],
              yAxes: [{
                gridLines: { color: "#334155" },
                ticks: { fontColor: "#94a3b8" }
              }]
            }
          }
        };
        
        const quickChartUrl = `https://quickchart.io/chart?bkg=%230f172a&w=800&h=350&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
        
        chartImagesHtml += `
          <br/>
          <br/>
          <div class="header-title" style="font-size: 14px; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-top: 20px;">
            Graphical Telemetry Trend Chart
          </div>
          <div class="header-date" style="padding-bottom: 10px;">
            Live telemetry timeline trend graph generated natively for Excel reports (Requires internet connection to view)
          </div>
          <br/>
          <img src="${quickChartUrl}" width="800" height="350" />
          <br/>
        `;
      } catch (err) {
        console.error("Failed to compile QuickChart config", err);
      }
    }

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Transmission Report</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          th { background-color: #0f172a; color: #ffffff; font-weight: bold; text-align: left; border: 1px solid #334155; padding: 12px 10px; font-size: 12px; text-transform: uppercase; }
          td { border: 1px solid #cbd5e1; padding: 10px 10px; font-size: 12px; color: #334155; }
          .header-title { font-size: 16px; font-weight: bold; color: #0f172a; padding-bottom: 5px; }
          .header-date { font-size: 12px; color: #64748b; padding-bottom: 20px; }
          
          /* Status styling */
          .status-healthy { color: #15803d; font-weight: bold; background-color: #dcfce7; }
          .status-partial { color: #b45309; font-weight: bold; background-color: #fef3c7; }
          .status-lost { color: #b91c1c; font-weight: bold; background-color: #fee2e2; }
          
          /* Cell values alignment & style */
          .num { text-align: right; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          
          /* Custom metrics highlight */
          .loss-alert { color: #b91c1c; font-weight: bold; }
          .battery-warn { color: #b45309; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-title">${title}</div>
        <div class="header-date">Generated on: ${new Date().toLocaleString()} | Period: ${dateStr}</div>
        <table>
          <thead>
            <tr>
              <th>${viewLevel.toUpperCase()} NAME</th>
              <th>STATUS</th>
              <th class="num">PACKETS (ACTUAL / EXPECTED)</th>
              <th class="num">LOSS %</th>
              <th class="center">BATTERY</th>
              <th class="center">MAX TEMP</th>
              <th class="center">MAX VIB</th>
              <th class="center">ALERTS</th>
              <th class="num">UPTIME %</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.forEach((row) => {
      const totalPackets = row.totalPackets || 0;
      const totalExpected = row.totalExpected || 0;
      const onlineCount = row.rawSensors.filter((s: any) => s.connectivity === "online").length;
      const totalCount = row.rawSensors.length;
      const isLost = onlineCount === 0;
      const isPartial = onlineCount > 0 && onlineCount < totalCount;
      const statusClass = isLost ? 'status-lost' : isPartial ? 'status-partial' : 'status-healthy';
      const statusText = isLost ? 'LOST' : isPartial ? `PARTIAL (${onlineCount}/${totalCount})` : 'HEALTHY';
      
      const lossVal = row.lossPercentage || 0;
      const lossClass = lossVal > 50 ? 'loss-alert' : '';
      
      const batteryStr = row.batteryMin !== null ? `${row.batteryMin}% - ${row.batteryMax}%` : 'N/A';
      const batteryClass = (row.batteryMin !== null && row.batteryMin < 25) ? 'battery-warn' : '';
      
      const tempStr = row.tempMax !== null ? `${row.tempMax.toFixed(1)}°C` : 'N/A';
      const vibStr = row.vibMax !== null ? row.vibMax.toFixed(2) : 'N/A';
      const alertsCount = row.alerts || 0;
      const alertsClass = alertsCount > 0 ? 'loss-alert' : '';
      const uptimeVal = row.uptime || 0;

      html += `
        <tr>
          <td class="bold">${row.name}</td>
          <td class="${statusClass}">${statusText}</td>
          <td class="num">${totalPackets.toLocaleString()} of ${totalExpected.toLocaleString()}</td>
          <td class="num bold ${lossClass}">${lossVal.toFixed(1)}%</td>
          <td class="center ${batteryClass}">${batteryStr}</td>
          <td class="center">${tempStr}</td>
          <td class="center">${vibStr}</td>
          <td class="center ${alertsClass}">${alertsCount}</td>
          <td class="num bold">${uptimeVal.toFixed(1)}%</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
    `;

    // Append Captured Chart Images HTML
    html += chartImagesHtml;

    html += `
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    const scopeName = (selectedArea || "AllAreas").replace(/\s+/g, "_");
    const machineName = selectedMachine ? `_${selectedMachine.replace(/\s+/g, "_")}` : "";
    link.download = `Transmission_Report_${scopeName}${machineName}_${new Date().toISOString().split('T')[0]}.xls`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
  const allEntityNames = data.map((item) => item.name);

  return (
    <div className="bg-transparent flex flex-col">
      {/* Navigation Breadcrumbs */}
      <div className="px-4 md:px-6 py-3 bg-slate-950/20 border-b border-slate-800/50 flex flex-wrap items-center gap-2 md:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onGoBack}
          disabled={viewLevel === "area"}
          className="h-7 text-[10px] gap-1 bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
        >
          Go Back
        </Button>
        <div className="h-4 w-px bg-slate-800 hidden sm:block" />
        <div className="flex flex-wrap items-center gap-1 text-[11px]">
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

      <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800">
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
          {data.length > 2 && (
            <Button
              variant={isComparisonMode ? "default" : "outline"}
              size="sm"
              onClick={onToggleComparisonMode}
              className={cn(
                "h-8 text-xs transition-all duration-300 font-semibold px-3",
                isComparisonMode
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 border-none text-white hover:from-blue-600 hover:to-indigo-700 shadow-md shadow-blue-500/20"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              {isComparisonMode
                ? "Compare 2 Graphs: ON"
                : "Compare 2 Graphs: OFF"}
            </Button>
          )}

          {isComparisonMode && (
            <Button
              variant={showSensorDetails ? "default" : "outline"}
              size="sm"
              onClick={onToggleSensorDetails}
              className={cn(
                "h-8 text-xs transition-all duration-300 font-semibold px-3 gap-1.5",
                showSensorDetails
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white font-bold border-none shadow-md shadow-emerald-500/20"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
              )}
            >
              {showSensorDetails
                ? "Show Sensors Breakdown: ON"
                : "Show Sensors Breakdown: OFF"}
            </Button>
          )}

          <Button
            onClick={handleExportExcel}
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5 bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all hover:border-blue-500 hover:shadow-[0_0_8px_rgba(59,130,246,0.3)] cursor-pointer"
            title="Download fully-styled Excel spreadsheet with complete color formatting"
          >
            <Download size={13} />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[600px] relative border-b border-slate-800">
        <Table>
          <TableHeader className="bg-[#0f172a] sticky top-0 z-10 shadow-sm">
            <TableRow className="hover:bg-transparent border-slate-800">
              <TableHead className="w-[50px] hidden md:table-cell"></TableHead>
              <TableHead
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort("name")}
                title="The name of the area, machine, or sensor. Click to sort alphabetically."
              >
                <div className="flex items-center gap-1">
                  {viewLevel.toUpperCase()} Name
                  <ArrowUpDown size={0} className="hidden" />
                </div>
              </TableHead>
              <TableHead 
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 cursor-help"
                title="Current connection status. Shows the number of active online sensors."
              >
                Status
              </TableHead>
              <TableHead
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-right px-6 cursor-pointer hover:text-slate-200 transition-colors hidden md:table-cell"
                onClick={() => handleSort("packets")}
                title="Actual data packets received vs expected packets during this period. Click to sort."
              >
                <div className="flex items-center justify-end gap-1">
                  Packets
                  <ArrowUpDown size={0} className="hidden" />
                </div>
              </TableHead>
              <TableHead
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-right cursor-pointer hover:text-slate-200 transition-colors"
                onClick={() => handleSort("loss")}
                title="Data packet loss rate. Lower is better; values above 10% indicate signal interference. Click to sort."
              >
                <div className="flex items-center justify-end gap-1">
                  Loss %
                  <ArrowUpDown size={0} className="hidden" />
                </div>
              </TableHead>
              <TableHead 
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-center hidden lg:table-cell cursor-help"
                title="Minimum battery level recorded among the sensors. Prepare replacement if below 20%."
              >
                Battery
              </TableHead>
              <TableHead 
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-center hidden lg:table-cell cursor-help"
                title="Maximum temperature registered by sensors to monitor machinery overheating (>80°C)."
              >
                Max Temp
              </TableHead>
              <TableHead 
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-center hidden lg:table-cell cursor-help"
                title="Peak RMS vibration recorded across all 3 axes (H, V, A). Limits: normal <1.4, warning <2.8, danger >4.5 mm/s."
              >
                Max Vib
              </TableHead>
              <TableHead 
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-center hidden md:table-cell cursor-help"
                title="Total number of alarm thresholds breached during the period (e.g. high temperature or critical vibration)."
              >
                Alerts
              </TableHead>
              <TableHead
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-right cursor-pointer hover:text-slate-200 transition-colors hidden md:table-cell"
                onClick={() => handleSort("uptime")}
                title="Percentage of time sensors were online and transmitting data successfully. Click to sort."
              >
                <div className="flex items-center justify-end gap-1">
                  Uptime %
                  <ArrowUpDown size={0} className="hidden" />
                </div>
              </TableHead>
              <TableHead 
                className="text-[13px] md:text-[16px] font-bold text-slate-300 uppercase tracking-wide py-4 text-right cursor-help"
                title="Quick actions. Click to drill-down into sub-elements or view historical telemetry charts."
              >
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => {
              const totalPackets = row.totalPackets || 0;
              const onlineCount = row.rawSensors.filter(
                (s: any) => s.connectivity === "online"
              ).length;
              const isSelected = comparisonIds.includes(row.id);
              const uptime = row.uptime || 0;
              const lossPercentage = row.lossPercentage || 0;

              // Determine color based on stable index in the full data list
              const stableIndex = allEntityNames.indexOf(row.name);
              const rowColor = isSelected
                ? getDistinctColor(stableIndex >= 0 ? stableIndex : 0)
                : null;

              return (
                <TableRow
                  key={row.id}
                  style={rowColor ? { backgroundColor: `${rowColor}08` } : {}}
                  onClick={() => {
                    onToggleComparison(row.id);
                  }}
                  className={cn(
                    "border-slate-800/50 hover:bg-slate-800/30 transition-colors group cursor-pointer select-none",
                    isSelected && "border-l-2"
                  )}
                >
                  <TableCell
                    className="py-4 hidden md:table-cell"
                    style={rowColor ? { borderLeftColor: rowColor } : {}}
                  >
                    <Checkbox
                      checked={isSelected}
                      style={
                        rowColor
                          ? {
                              backgroundColor: isSelected
                                ? rowColor
                                : "transparent",
                              borderColor: isSelected ? rowColor : undefined,
                            }
                          : {}
                      }
                      className="border-slate-700 data-[state=checked]:text-slate-900 pointer-events-none"
                    />
                  </TableCell>
                  <TableCell className="py-3 md:py-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      {rowColor && (
                        <div
                          className="w-1 h-5 md:w-1.5 md:h-6 rounded-full shrink-0"
                          style={{ backgroundColor: rowColor }}
                        />
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-slate-100 text-[14px] md:text-[20px] truncate max-w-[120px] sm:max-w-none">
                          {row.name}
                        </span>
                        {viewLevel === "sensor" &&
                          row.rawSensors[0]?.serialNumber && (
                            <span className="text-[11px] md:text-[13px] text-blue-400/70 font-mono truncate">
                              SN: {row.rawSensors[0].serialNumber}
                            </span>
                          )}
                        {viewLevel === "sensor" && (
                          <span className="text-[12px] md:text-[14px] text-slate-500 truncate max-w-[120px]">
                            {row.rawSensors[0]?.sensor_type || "Group"}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 md:py-4">
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          onlineCount > 0
                            ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                            : "bg-slate-600"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[13px] md:text-[18px] font-medium truncate",
                          onlineCount > 0 ? "text-green-400" : "text-slate-500"
                        )}
                      >
                        {onlineCount > 0
                          ? viewLevel === "sensor"
                            ? "Online"
                            : `${onlineCount} Act.`
                          : "Offline"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-4 font-mono text-[18px] text-slate-300 px-6 hidden md:table-cell">
                    <div className="flex flex-col items-end">
                      <span>{totalPackets.toLocaleString()}</span>
                      {row.totalExpected > totalPackets && (
                        <span className="text-[13px] text-slate-500">
                          of {row.totalExpected.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3 md:py-4">
                    <div className="flex items-center justify-end gap-1 text-[13px] md:text-[18px]">
                      <span
                        className={cn(
                          "font-medium",
                          lossPercentage > 10
                            ? "text-rose-400"
                            : lossPercentage > 0
                              ? "text-amber-400"
                              : "text-green-400"
                        )}
                      >
                        {lossPercentage.toFixed(1)}%
                      </span>
                      {row.lostMins > 0 && (
                        <span className="text-[11px] md:text-[13px] text-slate-500 ml-1 hidden md:inline">
                          ({formatLostTime(row.lostMins)})
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4 hidden lg:table-cell">
                    <div className="flex flex-col items-center justify-center">
                      {row.batteryMin != null ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50 border border-slate-800">
                          <span
                            className={cn(
                              "text-[15px] font-mono",
                              row.batteryMin < 20
                                ? "text-rose-400 font-bold"
                                : "text-slate-300"
                            )}
                          >
                            {row.batteryMin.toFixed(2)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-[18px] text-slate-600 font-mono">
                          -
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-4 hidden lg:table-cell">
                    {row.tempMax != null ? (
                       <span
                         className={cn(
                           "text-[18px] font-mono font-bold px-2 py-0.5 rounded",
                           row.tempMax > 80
                             ? "text-rose-400 bg-rose-500/10"
                             : "text-amber-400"
                         )}
                       >
                         {row.tempMax.toFixed(1)}°C
                       </span>
                    ) : (
                       <span className="text-[18px] text-slate-600 font-mono">
                         -
                       </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4 hidden lg:table-cell">
                    {row.vibMax != null ? (
                       <span
                         className={cn(
                           "text-[18px] font-mono",
                           row.vibMax > 9.0
                             ? "text-rose-400 font-bold"
                             : "text-slate-300"
                         )}
                       >
                         {row.vibMax.toFixed(2)}
                       </span>
                    ) : (
                       <span className="text-[18px] text-slate-600 font-mono">
                         -
                       </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center py-4 hidden md:table-cell">
                    {row.alerts != null && row.alerts > 0 ? (
                       <span className="text-[18px] font-mono font-bold text-rose-400 px-2 py-0.5 bg-rose-500/10 rounded-full">
                         {row.alerts}
                       </span>
                    ) : (
                       <span className="text-[18px] text-slate-600 font-mono">
                         -
                       </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-4 font-mono hidden md:table-cell">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={cn(
                          "text-[18px] font-bold",
                          uptime > 95
                            ? "text-green-500"
                            : uptime > 80
                              ? "text-amber-500"
                              : "text-rose-500"
                        )}
                      >
                        {uptime.toFixed(1)}%
                      </span>
                      <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden leading-none">
                        <div
                          className={cn(
                            "h-full transition-all duration-500",
                            uptime > 95
                              ? "bg-green-500"
                              : uptime > 80
                                ? "bg-amber-500"
                                : "bg-rose-500"
                          )}
                          style={{ width: `${uptime}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3 md:py-4" onClick={(e) => e.stopPropagation()}>
                    {viewLevel !== "sensor" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDrillDown(row.name);
                        }}
                        className="h-8 text-[12px] md:text-[15px] gap-1 text-slate-400 hover:text-white hover:bg-slate-800 group px-2"
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
        <div
          ref={observerTarget}
          className="h-12 flex items-center justify-center border-t border-slate-800/30 bg-slate-900/10"
        >
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
