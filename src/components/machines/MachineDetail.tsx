"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { MachineHealth } from "@/api/machineHealth";
import { LEVEL_NAME, ago, eventText, headlineOf, worstProblem } from "./machineUi";

import MachineDiagram from "./MachineDiagram";
import SensorCards from "./SensorCards";
import { layoutFor } from "./machineLayout";
import { Panel } from "./widgets/WidgetCard";
import { DataReliability, DiagnosisWhy, Temperature, VibrationLimits, useSensorCtx } from "./widgets/MachineWidgets";

// the chart library is only needed on this page, and not on the server
const MachineTrend = dynamic(() => import("./MachineTrend"), {
  ssr: false,
  loading: () => <div className="py-8 text-center text-sm text-gray-500">Loading…</div>,
});

/**
 * One machine, top to bottom: header with the overall health; the X-ray (two thirds) beside the
 * sensor cards (one third); the vibration history; then the diagnosis and the sensors' health.
 */
export default function MachineDetail({ m }: { m: MachineHealth }) {
  const f = m.top_finding;
  const hasPicture = layoutFor(m.sensors) !== null;
  const ctx = useSensorCtx(m);
  // undefined = the worst problem (if any), null = nothing selected; shared by picture and cards
  const [sel, setSel] = useState<string | null | undefined>(undefined);
  const selectedId = sel === undefined ? (worstProblem(m.sensors)?.sensor_id ?? null) : sel;

  return (
    <div className="space-y-4 rounded-lg border border-[#1e293b] bg-[#0f172a] p-4 text-gray-100">
      {/* 1. header + overall health */}
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
          <div>
            <div className="text-xl font-semibold text-white">{m.name}</div>
            <div className="text-xs text-gray-400">{[m.machine_no, m.area].filter(Boolean).join(" · ") || "-"}</div>
            <div className="mt-1 text-xs text-gray-500">Last data {ago(m.last_reading_at)}</div>
          </div>
          <div className="min-w-0 flex-1 basis-[280px] sm:max-w-xl">
            <div className="text-xs text-gray-400">Overall health · latest diagnosis</div>
            <div className="text-xl font-semibold leading-snug text-white">{headlineOf(m)}</div>
            {/* without a named fault the headline already says the level */}
            {m.status === "problem" && f && (
              <div className="text-sm text-orange-300">Level: {LEVEL_NAME[m.level] ?? ""}</div>
            )}
            {f && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded bg-[#1e293b]">
                    <div className="h-full bg-blue-400" style={{ width: `${Math.min(100, f.confidence)}%` }} />
                  </div>
                  <span className="w-12 text-right text-sm text-gray-200">{f.confidence}%</span>
                </div>
                <div className="text-xs text-gray-400">Confidence · found at {f.sensor_name}</div>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* 2. X-ray (2/3) | sensor cards, motor and pump (1/3) */}
      <div className={`grid items-start gap-4 ${hasPicture ? "lg:grid-cols-3" : ""}`}>
        {hasPicture && (
          <Panel className="lg:col-span-2">
            <MachineDiagram m={m} selectedId={selectedId} onSelect={setSel} />
          </Panel>
        )}
        <SensorCards m={m} selectedId={selectedId} onSelect={setSel} />
      </div>

      {/* 3. vibration history, full width */}
      <Panel>
        <MachineTrend machineKey={m.key} />
      </Panel>

      {/* 4. diagnosis | sensor health */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel title="Diagnosis & reasoning">
          <div className="space-y-4">
            <DiagnosisWhy m={m} />

            {f?.description_th && (
              <div>
                <div className="text-xs text-gray-400">What is this fault?</div>
                <div className="text-sm text-gray-200">{f.description_th}</div>
              </div>
            )}
            {f?.reasoning_th && (
              <div>
                <div className="text-xs text-gray-400">Why this pattern points to this fault</div>
                <div className="text-sm text-gray-200">{f.reasoning_th}</div>
              </div>
            )}
            {f?.recommendation_th && (
              <div>
                <div className="text-xs text-gray-400">Recommendation</div>
                <div className="text-sm text-gray-200">{f.recommendation_th}</div>
              </div>
            )}

            <div>
              <div className="mb-1 text-xs text-gray-400">Recent events</div>
              {m.recent_events.length === 0 ? (
                <div className="text-sm text-gray-500">No events yet</div>
              ) : (
                <div className="divide-y divide-[#1e293b] border-t border-[#1e293b]">
                  {m.recent_events.map((e) => (
                    <div key={e.id} className="flex gap-3 py-1.5 text-sm">
                      <span className="w-28 shrink-0 text-xs text-gray-500">{ago(e.created_at)}</span>
                      <span className="text-gray-200">
                        {eventText(e)}
                        <span className="text-gray-500"> · {e.sensor_name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel title="Sensor health & reliability">
          <div className="grid gap-4 sm:grid-cols-2">
            <VibrationLimits {...ctx} />
            <Temperature {...ctx} />
            <div className="sm:col-span-2">
              <DataReliability {...ctx} />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
