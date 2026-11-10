"use client";

import { useMemo } from "react";
import type { MachineHealth, SensorHealth, SensorLimits } from "@/api/machineHealth";
import {
  LEVEL_COLOR,
  LEVEL_NAME,
  ago,
  fmtBattery,
  fmtRms,
  fmtTemp,
  sensorColorMap,
  shortSensorName,
} from "../machineUi";
import WidgetCard, { How } from "./WidgetCard";

/** Battery at or below this is flagged. Our own convention, not a manufacturer figure. */
const LOW_BATTERY = 20;

const byName = (a: SensorHealth, b: SensorHealth) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

/** temperature limits of a sensor; both null when the server did not send limits */
const tempLimits = (s: SensorHealth): Pick<SensorLimits, "temp_min" | "temp_max"> =>
  s.limits ?? { temp_min: null, temp_max: null };

/** a small coloured dot: the sensor's own colour, as in the chart, the cards and the picture */
function Dot({ color }: { color: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />;
}

function peakRms(s: SensorHealth): number | null {
  const r = s.reading;
  if (!r) return null;
  const v = [r.rms_h, r.rms_v, r.rms_a].filter((x): x is number => x != null);
  return v.length ? Math.max(...v) : null;
}

/** same rule as the server: level n starts at limits[n - 1] */
function levelOf(rms: number, lim: [number, number, number]): number {
  return rms >= lim[2] ? 3 : rms >= lim[1] ? 2 : rms >= lim[0] ? 1 : 0;
}

function VibrationLimits({ m, sensors, colors }: Ctx) {
  const defaults = sensors.filter((s) => s.limits?.vib_is_default).map((s) => shortSensorName(s.name, m.machine_no));
  return (
    <WidgetCard
      title="Vibration vs limits"
      how={
        <>
          <How label="Data">
            the newest reading of each sensor: velocity RMS of H, V and A (mm/s). The largest of the three is shown.
          </How>
          <How label="Calculation">
            the value is compared with the sensor&apos;s own limits. Level 1 ({LEVEL_NAME[1]}) starts at the first tick,
            level 2 ({LEVEL_NAME[2]}) at the second, level 3 ({LEVEL_NAME[3]}) at the third. The bar colour is the level
            reached.
          </How>
          <How label="Limits">
            set per sensor in its settings
            {defaults.length > 0 ? `; the defaults 5 / 10 / 15 mm/s are used for ${defaults.join(", ")}` : ""}.
          </How>
          <How label="Why">
            these limits decide the status colours everywhere on this page, and the fault formulas only run once a
            sensor reaches level 1.
          </How>
        </>
      }
    >
      <div className="space-y-2.5">
        {sensors.map((s) => {
          const peak = peakRms(s);
          // an older server does not send the limits: show the value only, never guessed limits
          const lim = s.limits?.vib ?? null;
          const scale = lim ? Math.max(lim[2] * 1.15, peak ?? 0) : 1;
          const level = peak == null || !lim ? 0 : levelOf(peak, lim);
          const lost = s.status === "offline" || s.status === "no_data";
          const fill = lost ? "#404040" : LEVEL_COLOR[level];
          return (
            <div key={s.sensor_id}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-gray-200">
                  <Dot color={colors.get(s.sensor_id) ?? "#60a5fa"} />
                  <span className="truncate">{shortSensorName(s.name, m.machine_no)}</span>
                </span>
                <span className="shrink-0 text-gray-300">
                  {peak == null ? "No reading" : `${fmtRms(peak)} mm/s`}
                </span>
              </div>
              {lim ? (
                <div className="relative mt-1 h-2 rounded-full bg-[#1e293b]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.min(100, ((peak ?? 0) / scale) * 100)}%`, background: fill }}
                  />
                  {lim.map((l, i) => (
                    <span
                      key={i}
                      className="absolute -top-0.5 h-3 w-px"
                      style={{ left: `${(l / scale) * 100}%`, background: LEVEL_COLOR[i + 1] }}
                      title={`Level ${i + 1} (${LEVEL_NAME[i + 1]}) from ${l} mm/s`}
                    />
                  ))}
                </div>
              ) : (
                <div className="ml-4 text-[11px] text-gray-500">Limits not sent by the server (update the backend)</div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] text-gray-500">
        Ticks: {LEVEL_NAME[1]} / {LEVEL_NAME[2]} / {LEVEL_NAME[3]}
      </div>
    </WidgetCard>
  );
}

function DataReliability({ m, sensors, colors }: Ctx) {
  return (
    <WidgetCard
      title="Data reliability"
      how={
        <>
          <How label="Data">
            from each sensor&apos;s newest reading: when it arrived, the battery (%) and the signal strength (dBm).
          </How>
          <How label="Calculation">
            a sensor is &quot;not reporting&quot; when its newest reading is older than 30 minutes (the server setting
            OFFLINE_AFTER_MIN). A battery at or below {LOW_BATTERY}% is flagged low; that figure is our own convention,
            not a manufacturer value. Signal strength is shown as measured, without a verdict.
          </How>
          <How label="Why">
            a silent or low-battery sensor means the page may be showing old or missing data, so check this before
            trusting the other boxes.
          </How>
        </>
      }
    >
      <div className="space-y-2">
        {sensors.map((s) => {
          const r = s.reading;
          const silent = s.status === "offline" || s.status === "no_data";
          const battery = r?.battery;
          const low = battery != null && battery <= LOW_BATTERY;
          return (
            <div key={s.sensor_id} className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5 text-gray-200">
                  <Dot color={colors.get(s.sensor_id) ?? "#60a5fa"} />
                  <span className="truncate">{shortSensorName(s.name, m.machine_no)}</span>
                </span>
                <span className={silent ? "font-medium text-red-300" : "text-emerald-300"}>
                  {silent ? "Not reporting" : "Reporting"}
                </span>
              </div>
              <div className="ml-4 flex flex-wrap gap-x-3 text-[11px] text-gray-400">
                <span>Last data {ago(s.last_reading_at)}</span>
                {battery != null && (
                  <span className={low ? "font-medium text-amber-300" : ""}>
                    Battery {fmtBattery(battery)}%{low ? " (low)" : ""}
                  </span>
                )}
                {r?.rssi != null && <span>Signal {r.rssi} dBm</span>}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

function DiagnosisWhy({ m }: { m: MachineHealth }) {
  const f = m.top_finding;
  const rows = (f?.evidence ?? []).filter((e) => e.startsWith("✓") || e.startsWith("✗"));
  const summary = f?.evidence.find((e) => !e.startsWith("✓") && !e.startsWith("✗"));
  const note =
    m.status === "problem"
      ? "A sensor is above its first limit, but no fault formula matched strongly enough (more than 30% of its conditions)."
      : m.status === "ok"
        ? "No fault formula was run: every sensor is below its first limit, and the formulas only run above it."
        : "There is no recent data to analyse.";
  return (
    <WidgetCard
      title="Why this diagnosis"
      how={
        <>
          <How label="Data">
            the spectrum peaks (the 10 highest per axis H, V, A) of the reading that crossed the first limit.
          </How>
          <How label="Calculation">
            each fault formula has conditions with weights (for example &quot;1X is the strongest peak&quot;). The
            confidence is the weight of the conditions met divided by the total weight. Only results above 30% are
            reported.
          </How>
          <How label="Read it as">
            how well the pattern matches the formula, not a probability that the fault exists. If the shaft speed (1X)
            is marked as a guess, every 1X-based condition may be off.
          </How>
        </>
      }
    >
      {f ? (
        <div>
          <div className="text-xs text-gray-200">
            {f.label_en || f.code} · <span className="font-medium">{f.confidence}%</span>
          </div>
          {summary && <div className="mt-0.5 text-[11px] text-gray-500">{summary}</div>}
          <ul className="mt-1.5 space-y-1">
            {rows.map((e, i) => {
              const ok = e.startsWith("✓");
              return (
                <li key={i} className={`flex gap-1.5 text-[11px] leading-snug ${ok ? "text-emerald-200" : "text-gray-400"}`}>
                  <span className="shrink-0">{ok ? "✓" : "✗"}</span>
                  <span>{e.slice(1).trim()}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="text-xs text-gray-400">{note}</div>
      )}
    </WidgetCard>
  );
}

function Temperature({ m, sensors, colors }: Ctx) {
  return (
    <WidgetCard
      title="Temperature vs limits"
      how={
        <>
          <How label="Data">the temperature (°C) of each sensor&apos;s newest reading.</How>
          <How label="Calculation">
            compared with the temperature limits in the sensor&apos;s settings. Without a limit only the value is shown.
          </How>
          <How label="Note">
            the fault diagnosis does not use temperature yet, so this is for reference.
          </How>
        </>
      }
    >
      <div className="space-y-2.5">
        {sensors.map((s) => {
          const t = s.reading?.temperature ?? null;
          const { temp_min: lo, temp_max: hi } = tempLimits(s);
          const over = t != null && hi != null && t > hi;
          const under = t != null && lo != null && t < lo;
          const scale = hi != null ? Math.max(hi * 1.2, t ?? 0) : null;
          return (
            <div key={s.sensor_id}>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-gray-200">
                  <Dot color={colors.get(s.sensor_id) ?? "#60a5fa"} />
                  <span className="truncate">{shortSensorName(s.name, m.machine_no)}</span>
                </span>
                <span className={over || under ? "font-medium text-red-300" : "text-gray-300"}>
                  {t == null ? "No reading" : `${fmtTemp(t)} °C`}
                  {over ? " (above limit)" : under ? " (below limit)" : ""}
                </span>
              </div>
              {scale != null && hi != null ? (
                <div className="relative mt-1 h-2 rounded-full bg-[#1e293b]">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${Math.min(100, ((t ?? 0) / scale) * 100)}%`, background: over ? LEVEL_COLOR[3] : LEVEL_COLOR[0] }}
                  />
                  <span
                    className="absolute -top-0.5 h-3 w-px bg-red-400"
                    style={{ left: `${(hi / scale) * 100}%` }}
                    title={`Limit ${hi} °C`}
                  />
                </div>
              ) : (
                <div className="ml-4 text-[11px] text-gray-500">
                  {s.limits ? "No limit set" : "Limits not sent by the server (update the backend)"}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

interface Ctx {
  m: MachineHealth;
  sensors: SensorHealth[];
  colors: Map<string, string>;
}

/** What the per-sensor widgets share: the sensors in a stable order and their colours. */
export function useSensorCtx(m: MachineHealth): Ctx {
  const sensors = useMemo(() => [...m.sensors].sort(byName), [m.sensors]);
  const colors = useMemo(() => sensorColorMap(m.sensors), [m.sensors]);
  return { m, sensors, colors };
}

export { VibrationLimits, DataReliability, DiagnosisWhy, Temperature };
