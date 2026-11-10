"use client";

import { useMemo } from "react";
import type { MachineHealth, SensorHealth } from "@/api/machineHealth";
import { coverage, layoutFor, slotLabel, slotOfFinding, type SlotKey } from "./machineLayout";
import { STATUS_LABEL, codeName, sensorColorMap, sensorFinding as findingText, statusColor } from "./machineUi";

const SLOT_KEYS: SlotKey[] = ["MOTOR-NDE", "MOTOR-DE", "DRIVEN-DE", "DRIVEN-NDE"];

const colorOf = (s: SensorHealth) => statusColor(s.status, s.level);

/**
 * The machine as a small X-ray picture with each sensor as a dot on the bearing it sits on,
 * coloured by status. A problem is named above its dot. The selected sensor is chosen by the parent
 * so the picture and the sensor cards beside it stay in step.
 */
export default function MachineDiagram({
  m,
  selectedId,
  onSelect,
}: {
  m: MachineHealth;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const layout = useMemo(() => layoutFor(m.sensors), [m.sensors]);
  const colors = useMemo(() => sensorColorMap(m.sensors), [m.sensors]);
  if (!layout) return null;

  const { template, slots } = layout;
  const code = m.top_finding?.code ?? null;
  const cov = coverage(code, slots, slotOfFinding(code, slots));
  const missing = new Set<SlotKey>(cov?.missing ?? []);

  const selected = selectedId ? (m.sensors.find((s) => s.sensor_id === selectedId) ?? null) : null;
  const anyGuessed = SLOT_KEYS.some((k) => (slots[k] ?? []).some((p) => p.guessed));
  const label = { fontSize: "clamp(9px, 2cqw, 15px)", textShadow: "0 0 4px #000, 0 0 8px #000" } as const;

  return (
    <div className="w-full" style={{ containerType: "inline-size" }}>
      <div
        className="relative w-full overflow-hidden rounded-lg bg-black"
        style={{ aspectRatio: template.aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={template.image}
          alt={`X-ray view of a motor and ${template.drivenName.toLowerCase()}`}
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
        />

        {SLOT_KEYS.map((key) => {
          const pos = template.slots[key];
          const here = slots[key] ?? [];
          const top = here.reduce<SensorHealth | null>(
            (w, p) => (p.sensor.status === "problem" && (!w || p.sensor.level > w.level) ? p.sensor : w),
            null,
          );
          return (
            <div key={key}>
              {missing.has(key) && (
                <span
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-amber-300 motion-safe:animate-pulse"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: "6%", minWidth: 24, maxWidth: 66, aspectRatio: "1" }}
                  title={`${slotLabel(key, template)}: no sensor`}
                />
              )}

              {here.map((p, i) => {
                const s = p.sensor;
                const color = colorOf(s);
                const own = colors.get(s.sensor_id) ?? "#60a5fa";
                return (
                  <button
                    key={s.sensor_id}
                    type="button"
                    onClick={() => onSelect(selected?.sensor_id === s.sensor_id ? null : s.sensor_id)}
                    title={`${s.name}: ${STATUS_LABEL[s.status]}`}
                    aria-label={`${s.name}, ${STATUS_LABEL[s.status]}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus:outline-none"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      marginTop: (i - (here.length - 1) / 2) * 20,
                      width: "4.6%",
                      minWidth: 20,
                      maxWidth: 46,
                      aspectRatio: "1",
                      // the ring is the sensor's own colour (as in the chart and the cards), the core is its status
                      background: "#0b1220",
                      border: `3px ${p.guessed ? "dashed" : "solid"} ${own}`,
                      boxShadow: `0 0 10px ${own}99`,
                      outline: selected?.sensor_id === s.sensor_id ? "2px solid #ffffff" : "none",
                      outlineOffset: 3,
                    }}
                  >
                    {s.status === "problem" && (
                      <span
                        className="absolute rounded-full motion-safe:animate-ping"
                        style={{ inset: "18%", background: color, opacity: 0.45 }}
                      />
                    )}
                    <span className="absolute rounded-full" style={{ inset: "18%", background: color }} />
                  </button>
                );
              })}

              {/* the part (motor, pump) is plain from the picture: label only the end of the shaft */}
              <div
                className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap text-center leading-tight text-gray-400"
                style={{ left: `${pos.x}%`, top: `${pos.y + 8}%`, ...label }}
              >
                {key.endsWith("NDE") ? "NDE" : "DE"}
              </div>
              {top && (
                <div
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-center font-medium leading-tight"
                  style={{ left: `${pos.x}%`, top: `${pos.y - 8}%`, color: colorOf(top), ...label }}
                >
                  {findingText(top)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {cov && cov.missing.length > 0 && (
        <div className="mt-1 text-[11px] text-amber-300">
          No sensor at {cov.missing.map((k) => slotLabel(k, template)).join(", ")}: the mounting guide recommends one
          there for {codeName(code)}.
        </div>
      )}
      <div className="mt-1 text-[11px] text-gray-500">
        Ring = the sensor&apos;s colour (as in the cards and the chart), centre = its status.
        {anyGuessed ? " Dashed ring: position read from the sensor name." : ""}
      </div>
    </div>
  );
}
