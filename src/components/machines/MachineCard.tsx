"use client";

import Link from "next/link";
import type { MachineHealth } from "@/api/machineHealth";
import {
  LEVEL_NAME,
  STATUS_LABEL,
  ago,
  fmtRms,
  fmtTemp,
  headlineOf,
  liveSummary,
  machineHref,
  statusColor,
} from "./machineUi";

/** One machine, styled like the sensor cards on the home page. Click opens the detail page. */
export default function MachineCard({ m }: { m: MachineHealth }) {
  const dim = m.status === "offline" || m.status === "no_data";
  const color = statusColor(m.status, m.level);
  const f = m.top_finding;
  const place = [m.area, m.machine_no].filter(Boolean).join(" / ");
  const live = liveSummary(m);

  return (
    <Link href={machineHref(m)} className="block">
      <div
        className="w-full cursor-pointer overflow-hidden rounded-2xl shadow-sm transition-shadow hover:shadow-md"
        style={{
          backgroundColor: "#161E28",
          borderTop: `18px solid ${color}`,
          borderRight: "1.35px solid #374151",
          borderBottom: "1.35px solid #374151",
          borderLeft: "1.35px solid #374151",
          color: dim ? "#404040" : "#ffffff",
        }}
      >
        <div className="space-y-2 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-lg font-extrabold leading-tight sm:text-xl">{m.name}</div>
              <div className={`truncate text-sm ${dim ? "text-[#404040]" : "text-gray-400"}`}>
                {place || "-"}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xl font-bold leading-none sm:text-2xl" style={{ color: dim ? "#404040" : color }}>
                {dim ? "-" : LEVEL_NAME[m.level] ?? ""}
              </div>
              <div className={`mt-1 text-xs ${dim ? "text-[#404040]" : "text-gray-400"}`}>
                {STATUS_LABEL[m.status]}
              </div>
            </div>
          </div>

          <div className="min-h-[2.75rem]">
            <div className={`text-base font-semibold leading-snug ${dim ? "text-[#404040]" : "text-gray-100"}`}>
              {headlineOf(m)}
            </div>
            {f && m.status === "problem" && (
              <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                <span className="rounded border border-red-500/30 bg-red-500/20 px-1.5 py-0.5 font-bold text-red-400">
                  Confidence {f.confidence}%
                </span>
                <span className="truncate">at {f.sensor_name}</span>
              </div>
            )}
          </div>

          {live.working > 0 && (
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/20 px-2 py-1.5 text-center">
              <div>
                <div className="text-base font-bold leading-none text-white">{fmtRms(live.rms)}</div>
                <div className="mt-0.5 text-[10px] text-gray-400">Peak vibration (mm/s)</div>
              </div>
              <div>
                <div className="text-base font-bold leading-none text-white">{fmtTemp(live.temperature)}°C</div>
                <div className="mt-0.5 text-[10px] text-gray-400">Peak temp.</div>
              </div>
              <div>
                <div className="text-base font-bold leading-none text-white">
                  {live.working}/{m.sensors.length}
                </div>
                <div className="mt-0.5 text-[10px] text-gray-400">Sensors working</div>
              </div>
            </div>
          )}

          <div className={`flex items-center justify-between gap-2 text-xs ${dim ? "text-[#404040]" : "text-[#7A8290]"}`}>
            <div className="flex items-center gap-1" title="Status per sensor">
              {m.sensors.slice(0, 8).map((s) => (
                <span
                  key={s.sensor_id}
                  title={`${s.name}: ${s.status === "problem" ? s.label_en ?? "Fault detected" : STATUS_LABEL[s.status]}`}
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: statusColor(s.status, s.level) }}
                />
              ))}
              <span className="ml-1">{m.sensors.length} {m.sensors.length === 1 ? "sensor" : "sensors"}</span>
            </div>
            <span className="truncate">{ago(m.last_reading_at)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
