"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import SummaryCards from "@/components/reports/SummaryCards";
import DataTransmissionChart from "@/components/reports/DataTransmissionChart";
import ReportDataTable from "@/components/reports/ReportDataTable";
import {
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  differenceInDays,
} from "date-fns";
import { fetchRealSensors } from "@/lib/data/sensors";
import { fetchTransmissionReport } from "@/lib/data/reports";
import { Sensor } from "@/lib/types";
import { Loader2, CalendarDays } from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function ReportsPage() {
  const [viewLevel, setViewLevel] = useState<"area" | "machine" | "sensor">(
    "area"
  );
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: subDays(new Date(), 1),
  });
  const [tempDateRange, setTempDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 7),
    to: subDays(new Date(), 1),
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    setTempDateRange(dateRange);
  }, [dateRange]);

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

  const [sensorType, setSensorType] = useState<string>("all");
  const [chartMode, setChartMode] = useState<"stacked" | "grouped">("stacked");
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [showSensorDetails, setShowSensorDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });

  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [apiData, setApiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingData, setFetchingData] = useState(false);

  // Load basic sensor list
  useEffect(() => {
    async function loadSensors() {
      const data = await fetchRealSensors(true);
      setSensors(data);
    }
    loadSensors();
  }, []);

  // Fetch Transmission Report API Data
  useEffect(() => {
    async function loadApiData() {
      setFetchingData(true);
      const startDateStr = format(dateRange.from, "yyyy-MM-dd");
      const endDateStr = format(dateRange.to || dateRange.from, "yyyy-MM-dd");

      const data = await fetchTransmissionReport(startDateStr, endDateStr);
      setApiData(data);
      setFetchingData(false);
      setLoading(false);
    }
    loadApiData();
  }, [dateRange]);

  // Enrich API Data with metadata from `sensors`
  const enrichedData = useMemo(() => {
    let base = apiData.map((d) => {
      const s = sensors.find((sen) => String(sen.id) === String(d.sensor_id));
      return {
        ...d,
        area: s?.area || "Unassigned",
        sensor_type: s?.sensor_type || "Master",
        sensorRef: s,
      };
    });

    if (sensorType !== "all") {
      base = base.filter(
        (d) => d.sensor_type?.toLowerCase() === sensorType.toLowerCase()
      );
    }
    
    return base;
  }, [apiData, sensors, sensorType]);

  const filteredSensors = useMemo(() => {
    if (sensorType === "all") return sensors;
    return sensors.filter(
      (s) => s.sensor_type?.toLowerCase() === sensorType.toLowerCase()
    );
  }, [sensors, sensorType]);

  // Hierarchical Data for the Table
  const tableData = useMemo(() => {
    if (filteredSensors.length === 0) return [];

    let filtered = filteredSensors;

    const apiBySensor = enrichedData.reduce(
      (acc, d) => {
        const key = String(d.sensor_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(d);
        return acc;
      },
      {} as Record<string, typeof enrichedData>
    );

    const computeGroupStats = (sensorList: Sensor[]) => {
      let totalExpected = 0;
      let totalActual = 0;
      let totalLostMins = 0;
      let totalUptimeSum = 0;
      let uptimeCount = 0;
      let hAxisSum = 0,
        vAxisSum = 0,
        aAxisSum = 0;
      let alerts = 0;
      let batteryMin = 100,
        batteryMax = 0;
      let rssiMin = 0,
        rssiMax = -200;
      let tempMax = -999;
      let vibMax = -1;

      sensorList.forEach((s) => {
        const records = apiBySensor[s.id] || [];
        records.forEach((r: any) => {
          totalExpected += r.expected_count || 0;
          totalActual += r.actual_count || 0;
          totalLostMins += r.lost_minutes || 0;
          if (r.uptime_percentage != null) {
            totalUptimeSum += r.uptime_percentage;
            uptimeCount++;
          }
          hAxisSum += r.h_axis_count || 0;
          vAxisSum += r.v_axis_count || 0;
          aAxisSum += r.a_axis_count || 0;
          alerts += r.alert_count || 0;

          if (r.battery_min !== null && r.battery_min < batteryMin)
            batteryMin = r.battery_min;
          if (r.battery_max !== null && r.battery_max > batteryMax)
            batteryMax = r.battery_max;
          if (r.rssi_min !== null && r.rssi_min < rssiMin) rssiMin = r.rssi_min;
          if (r.rssi_max !== null && r.rssi_max > rssiMax) rssiMax = r.rssi_max;
          if (r.temperature_max !== null && r.temperature_max > tempMax)
            tempMax = r.temperature_max;
          if (r.velo_rms_h_max !== null && r.velo_rms_h_max > vibMax)
            vibMax = r.velo_rms_h_max;
          if (r.velo_rms_v_max !== null && r.velo_rms_v_max > vibMax)
            vibMax = r.velo_rms_v_max;
          if (r.velo_rms_a_max !== null && r.velo_rms_a_max > vibMax)
            vibMax = r.velo_rms_a_max;
        });
      });

      const uptime = uptimeCount > 0 ? totalUptimeSum / uptimeCount : 100;
      const lossPercentage =
        totalExpected > 0
          ? ((totalExpected - totalActual) / totalExpected) * 100
          : 0;

      return {
        totalPackets: totalActual,
        totalExpected,
        lostMins: totalLostMins,
        uptime,
        lossPercentage: Math.max(0, lossPercentage),
        h: hAxisSum,
        v: vAxisSum,
        a: aAxisSum,
        alerts,
        batteryMin: batteryMin === 100 ? null : batteryMin,
        batteryMax: batteryMax === 0 ? null : batteryMax,
        rssiMin: rssiMin === 0 ? null : rssiMin,
        rssiMax: rssiMax === -200 ? null : rssiMax,
        tempMax: tempMax === -999 ? null : tempMax,
        vibMax: vibMax === -1 ? null : vibMax,
      };
    };

    let results: any[] = [];

    if (viewLevel === "area") {
      const areas = Array.from(new Set(filtered.map((s) => s.area))).filter(
        Boolean
      );
      results = areas.map((area) => {
        const areaSensors = filtered.filter((s) => s.area === area);
        const stats = computeGroupStats(areaSensors);
        return {
          id: area,
          name: area || "Unassigned",
          ...stats,
          rawSensors: areaSensors,
        };
      });
    } else if (viewLevel === "machine") {
      let machineSensors = filtered;
      if (selectedArea)
        machineSensors = machineSensors.filter((s) => s.area === selectedArea);
      const machines = Array.from(
        new Set(machineSensors.map((s) => s.machineName))
      ).filter(Boolean);
      results = machines.map((machine) => {
        const sensorsInMachine = machineSensors.filter(
          (s) => s.machineName === machine
        );
        const stats = computeGroupStats(sensorsInMachine);
        return {
          id: machine,
          name: machine || "Unknown Machine",
          ...stats,
          rawSensors: sensorsInMachine,
        };
      });
    } else if (viewLevel === "sensor") {
      let filteredSensors = filtered;
      if (selectedMachine) {
        filteredSensors = filteredSensors.filter(
          (s) => s.machineName === selectedMachine
        );
      } else if (selectedArea) {
        filteredSensors = filteredSensors.filter(
          (s) => s.area === selectedArea
        );
      }

      results = filteredSensors.map((s) => {
        const stats = computeGroupStats([s]);
        return {
          id: s.id,
          name: s.name || s.serialNumber,
          ...stats,
          rawSensors: [s],
        };
      });
    }

    // Apply Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter((r) => r.name.toLowerCase().includes(q));
    }

    // Apply Sort
    return results.sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "packets") {
        valA = a.totalPackets;
        valB = b.totalPackets;
      }
      if (sortConfig.key === "loss") {
        valA = a.lossPercentage;
        valB = b.lossPercentage;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        const cmp = valA.localeCompare(valB, undefined, {
          numeric: true,
          sensitivity: "base",
        });
        return sortConfig.direction === "asc" ? cmp : -cmp;
      }

      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortConfig.direction === "asc" ? numA - numB : numB - numA;
    });
  }, [
    sensors,
    viewLevel,
    selectedArea,
    selectedMachine,
    sensorType,
    enrichedData,
    searchQuery,
    sortConfig,
  ]);

  // Streaming Aggregated Chart data
  const timeSeriesData = useMemo(() => {
    if (sensors.length === 0 || enrichedData.length === 0) return [];

    const itemsToCompare =
      comparisonIds.length > 0
        ? tableData.filter(
            (item) => item.id && comparisonIds.includes(item.id as string)
          )
        : tableData;

    const sDate = startOfDay(dateRange.from);
    const eDate = endOfDay(dateRange.to || dateRange.from);
    const diffDays = differenceInDays(eDate, sDate);
    const isDaily = diffDays > 2;

    const intervals = isDaily
      ? eachDayOfInterval({ start: sDate, end: startOfDay(eDate) })
      : eachHourOfInterval({ start: sDate, end: eDate });

    const dataByDay = enrichedData.reduce(
      (acc, d) => {
        if (!acc[d.date]) acc[d.date] = [];
        acc[d.date].push(d);
        return acc;
      },
      {} as Record<string, typeof enrichedData>
    );

    return intervals.map((timePoint) => {
      const bucketName = format(timePoint, isDaily ? "EEE dd" : "HH:00");
      const bucketDateStr = format(timePoint, "yyyy-MM-dd");
      const hourIdx = timePoint.getHours();

      const bucket: any = {
        name: bucketName,
        fullDate: timePoint,
        _stats: { total: itemsToCompare.length, active: 0 },
      };

      itemsToCompare.forEach((entity) => {
        let entityCount = 0;
        let entityBatterySum = 0;
        let entityBatteryCount = 0;
        let entityTempMax = -999;
        let entityAlerts = 0;
        let isLost = true;

        entity.rawSensors.forEach((s: any) => {
          const records = dataByDay[bucketDateStr] || [];
          const record = records.find((r: any) => String(r.sensor_id) === String(s.id));

          let sensorCount = 0;
          let sensorBatterySum = 0;
          let sensorBatteryCount = 0;
          let sensorTempMax = -999;
          let sensorAlerts = 0;
          let sensorIsLost = true;

          if (record) {
            if (isDaily) {
              sensorCount = record.actual_count || 0;
              if ((record.actual_count || 0) > 0) sensorIsLost = false;
            } else {
              let hourlyCountsArray: number[] = [];
              if (Array.isArray(record.hourly_counts)) {
                hourlyCountsArray = record.hourly_counts;
              } else if (typeof record.hourly_counts === "string") {
                let cleanStr = record.hourly_counts.trim();
                if (cleanStr.startsWith("{") && cleanStr.endsWith("}")) {
                  cleanStr = cleanStr.slice(1, -1);
                  hourlyCountsArray = cleanStr.split(",").map(Number);
                } else {
                  try {
                    const parsed = JSON.parse(cleanStr);
                    if (Array.isArray(parsed)) {
                      hourlyCountsArray = parsed;
                    }
                  } catch {
                    hourlyCountsArray = cleanStr.split(",").map(Number);
                  }
                }
              }

              let hCount = hourlyCountsArray?.[hourIdx] || 0;
              
              // Robust Fallback: If hourly breakdown is empty/missing but daily total actual_count is present
              if (
                (!hourlyCountsArray || 
                 hourlyCountsArray.length === 0 || 
                 hourlyCountsArray.reduce((sum, val) => sum + val, 0) === 0) && 
                record.actual_count > 0
              ) {
                hCount = Math.round(record.actual_count / 24);
              }

              sensorCount = hCount;
              if (hCount > 0) sensorIsLost = false;
            }

            // Aggregate extra metrics
            if (record.battery_avg != null) {
              sensorBatterySum = record.battery_avg;
              sensorBatteryCount = 1;
            }
            if (record.temperature_max != null) {
              sensorTempMax = record.temperature_max;
            }
            sensorAlerts = record.alert_count || 0;
          }

          // Accumulate for entity
          entityCount += sensorCount;
          if (!sensorIsLost) isLost = false;
          if (sensorBatteryCount > 0) {
            entityBatterySum += sensorBatterySum;
            entityBatteryCount++;
          }
          if (sensorTempMax > entityTempMax) {
            entityTempMax = sensorTempMax;
          }
          entityAlerts += sensorAlerts;

          // Store for individual sensor (breakdown mode)
          const sensorName = s.name || s.serialNumber;
          bucket[sensorName] = sensorCount;
          bucket[`${sensorName}_packets`] = sensorCount;
          bucket[`${sensorName}_battery`] = sensorBatteryCount > 0 ? Number(sensorBatterySum.toFixed(1)) : null;
          bucket[`${sensorName}_temp`] = sensorTempMax === -999 ? null : Number(sensorTempMax.toFixed(1));
          bucket[`${sensorName}_alerts`] = sensorAlerts;
        });

        // Store standard metric for legacy compatibility, and specific ones for the new Chart toggles
        bucket[entity.name] = entityCount;
        bucket[`${entity.name}_packets`] = entityCount;
        bucket[`${entity.name}_battery`] =
          entityBatteryCount > 0
            ? Number((entityBatterySum / entityBatteryCount).toFixed(1))
            : null;
        bucket[`${entity.name}_temp`] =
          entityTempMax === -999 ? null : Number(entityTempMax.toFixed(1));
        bucket[`${entity.name}_alerts`] = entityAlerts;

        if (!isLost) bucket._stats.active++;
      });

      if (
        bucket._stats.active === itemsToCompare.length &&
        itemsToCompare.length > 0
      ) {
        bucket.status = "healthy";
      } else if (bucket._stats.active === 0) {
        bucket.status = "lost";
      } else {
        bucket.status = "partial";
      }

      return bucket;
    });
  }, [tableData, enrichedData, comparisonIds, dateRange]);

  const handleToggleComparisonMode = () => {
    setIsComparisonMode((prev) => {
      const next = !prev;
      if (next) {
        setComparisonIds((ids) => ids.slice(-2));
      } else {
        setComparisonIds([]);
      }
      return next;
    });
  };

  const toggleComparison = (id: string) => {
    if (isComparisonMode) {
      setComparisonIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((i) => i !== id);
        } else {
          return [...prev, id].slice(-2);
        }
      });
    } else {
      setComparisonIds((prev) =>
        prev.includes(id)
          ? prev.filter((i) => i !== id)
          : [...prev, id].slice(-10)
      );
    }
  };

  const handleDrillDown = (name: string) => {
    if (viewLevel === "area") {
      setSelectedArea(name);
      setViewLevel("machine");
    } else if (viewLevel === "machine") {
      setSelectedMachine(name);
      setViewLevel("sensor");
    }
    setComparisonIds([]);
  };

  const handleGoBack = () => {
    if (viewLevel === "sensor") {
      setSelectedMachine(null);
      setViewLevel("machine");
    } else if (viewLevel === "machine") {
      setSelectedArea(null);
      setViewLevel("area");
    }
    setComparisonIds([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["superadmin"]} mode="redirect" redirectPath="/">
      <div className="flex flex-col gap-6 p-4 sm:p-6 pt-20 md:pt-6 min-h-screen bg-transparent">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Data Transmission Report
          </h1>
          <p className="text-slate-400">
            Analyze sensor connectivity, loss percentage, and transmission
            trends over time.
          </p>
        </div>
      </div>

      <SummaryCards sensors={filteredSensors} apiData={enrichedData} />

      <div className="w-full space-y-6">
        <Card className="p-6 border-slate-800 shadow-xl bg-slate-900/50 backdrop-blur-sm">
          <DataTransmissionChart
            viewLevel={viewLevel}
            data={timeSeriesData}
            entities={
              comparisonIds.length > 0
                ? tableData
                    .filter(
                      (i) => i.id && comparisonIds.includes(i.id as string)
                    )
                    .map((i) => i.name)
                : tableData.map((i) => i.name)
            }
            allEntities={tableData.map((i) => i.name)}
            selectedArea={selectedArea}
            selectedMachine={selectedMachine}
            chartMode={chartMode}
            setChartMode={setChartMode}
            onDrillDown={handleDrillDown}
            onGoBack={handleGoBack}
            dateRange={dateRange}
            setDateRange={setDateRange}
            loading={fetchingData}
            sensors={sensors}
            isComparisonMode={isComparisonMode}
            showSensorDetails={showSensorDetails}
          />
        </Card>

        <Card className="p-0 border-slate-800 shadow-xl bg-slate-900/50 backdrop-blur-sm overflow-hidden text-white">
          <ReportDataTable
            viewLevel={viewLevel}
            data={tableData}
            selectedArea={selectedArea}
            selectedMachine={selectedMachine}
            sensorType={sensorType}
            dateRange={dateRange}
            comparisonIds={comparisonIds}
            onToggleComparison={toggleComparison}
            onDrillDown={handleDrillDown}
            onGoBack={handleGoBack}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isComparisonMode={isComparisonMode}
            onToggleComparisonMode={handleToggleComparisonMode}
            showSensorDetails={showSensorDetails}
            onToggleSensorDetails={() => setShowSensorDetails((prev) => !prev)}
            timeSeriesData={timeSeriesData}
          />
        </Card>
      </div>
    </div>
    </RoleGuard>
  );
}
