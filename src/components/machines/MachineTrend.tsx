"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getMachineTrend, type MachineTrend, type TrendRange } from "@/api/machineTrend";
import { LEVEL_COLOR, SENSOR_COLORS, sensorColorMap } from "./machineUi";

const RANGES: [TrendRange, string][] = [
  ["24h", "24 hours"],
  ["7d", "7 days"],
  ["30d", "30 days"],
];

const EVENT_COLOR: Record<string, string> = {
  new: "#ff4d4d",
  worsened: "#ff4d4d",
  changed: "#ff8c1a",
  cleared: "#72ff82",
  offline: "#9ca3af",
  online: "#9ca3af",
};

const TZ = "Asia/Bangkok";

function fmtTick(ms: number, range: TrendRange) {
  const d = new Date(ms);
  return range === "24h"
    ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ })
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", timeZone: TZ });
}

const fmtFull = (ms: number) =>
  new Date(ms).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TZ });

type Row = Record<string, number | null> & { t: number };

/** one row per time bucket, one column per sensor: `s0`, `s1`, ... */
function rowsFor(trend: MachineTrend, pick: (p: MachineTrend["sensors"][number]["points"][number]) => number | null): Row[] {
  const byTime = new Map<number, Row>();
  trend.sensors.forEach((s, i) => {
    for (const p of s.points) {
      const t = new Date(p.t).getTime();
      const row = byTime.get(t) ?? ({ t } as Row);
      row[`s${i}`] = pick(p);
      byTime.set(t, row);
    }
  });
  return Array.from(byTime.values()).sort((a, b) => a.t - b.t);
}

const peak = (p: { rms_h: number | null; rms_v: number | null; rms_a: number | null }) => {
  const v = [p.rms_h, p.rms_v, p.rms_a].filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : null;
};

function Chart({
  title,
  unit,
  trend,
  range,
  rows,
  thresholds,
}: {
  title: string;
  unit: string;
  trend: MachineTrend;
  range: TrendRange;
  rows: Row[];
  thresholds?: [number, number, number] | null;
}) {
  const from = new Date(trend.from).getTime();
  const to = new Date(trend.to).getTime();
  const events = trend.events.slice(0, 30);
  const colors = sensorColorMap(trend.sensors);
  return (
    <div>
      <div className="mb-1 text-xs text-gray-400">
        {title} <span className="text-gray-500">({unit})</span>
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer>
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#1e293b" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={[from, to]}
              tickFormatter={(v) => fmtTick(v, range)}
              stroke="#6b7280"
              fontSize={11}
            />
            <YAxis stroke="#6b7280" fontSize={11} width={40} domain={[0, "auto"]} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #374151", fontSize: 12 }}
              labelFormatter={(v) => fmtFull(Number(v))}
              formatter={(v: number) => (v == null ? "-" : Number(v).toFixed(2))}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {thresholds &&
              thresholds.map((y, i) => (
                <ReferenceLine key={i} y={y} stroke={LEVEL_COLOR[i + 1]} strokeDasharray="4 4" ifOverflow="extendDomain" />
              ))}
            {events.map((e) => {
              const t = new Date(e.created_at).getTime();
              return t >= from && t <= to ? (
                <ReferenceLine key={e.id} x={t} stroke={EVENT_COLOR[e.kind] ?? "#9ca3af"} strokeOpacity={0.6} />
              ) : null;
            })}
            {trend.sensors.map((s, i) => (
              <Line
                key={s.sensor_id}
                dataKey={`s${i}`}
                name={s.installed_point ? `${s.name} (${s.installed_point})` : s.name}
                stroke={colors.get(s.sensor_id) ?? SENSOR_COLORS[i % SENSOR_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * History of a machine: peak vibration and temperature of every sensor on one time axis,
 * with the sensors' thresholds and the diagnosis events marked. Loaded once per range (the
 * server returns ~1,500 points for four sensors); it does not poll.
 */
export default function MachineTrend({ machineKey }: { machineKey: string }) {
  const [range, setRange] = useState<TrendRange>("24h");
  const [trend, setTrend] = useState<MachineTrend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    getMachineTrend(machineKey, range, ctrl.signal)
      .then((t) => {
        setTrend(t);
        setError(null);
      })
      .catch((e) => {
        if (axios.isCancel(e)) return;
        setError("Failed to load history");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [machineKey, range]);

  const vibration = useMemo(() => (trend ? rowsFor(trend, peak) : []), [trend]);
  const temperature = useMemo(() => (trend ? rowsFor(trend, (p) => p.temperature) : []), [trend]);

  /** threshold lines only when every sensor uses the same ones, otherwise they would mislead */
  const thresholds = useMemo<[number, number, number] | null>(() => {
    const s = trend?.sensors ?? [];
    if (s.length === 0) return null;
    const same = s.every(
      (x) =>
        x.threshold_min === s[0].threshold_min &&
        x.threshold_medium === s[0].threshold_medium &&
        x.threshold_max === s[0].threshold_max
    );
    return same ? [s[0].threshold_min, s[0].threshold_medium, s[0].threshold_max] : null;
  }, [trend]);

  const hasData = (trend?.sensors ?? []).some((s) => s.points.length > 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-white">History</div>
        <div className="inline-flex overflow-hidden rounded border border-[#374151] text-xs">
          {RANGES.map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1 ${range === key ? "bg-blue-600 text-white" : "bg-[#161E28] text-gray-300"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="text-xs text-red-300">{error}</div>}

      {loading && !trend ? (
        <div className="py-8 text-center text-sm text-gray-500">Loading…</div>
      ) : trend && !hasData ? (
        <div className="py-8 text-center text-sm text-gray-500">No readings in this period</div>
      ) : trend ? (
        <div className={`space-y-4 ${loading ? "opacity-60" : ""}`}>
          <Chart
            title="Peak vibration of each sensor"
            unit="mm/s"
            trend={trend}
            range={range}
            rows={vibration}
            thresholds={thresholds}
          />
          <Chart title="Temperature" unit="°C" trend={trend} range={range} rows={temperature} />
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {thresholds && (
              <span>
                Dashed lines: Warning {thresholds[0]}, Concern {thresholds[1]}, Critical {thresholds[2]} mm/s
              </span>
            )}
            {trend.events.length > 0 && (
              <span>
                Vertical lines: <span style={{ color: EVENT_COLOR.new }}>fault</span> ·{" "}
                <span style={{ color: EVENT_COLOR.cleared }}>back to normal</span> ·{" "}
                <span style={{ color: EVENT_COLOR.offline }}>sensor lost / back</span>
              </span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
