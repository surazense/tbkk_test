"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { MachineHealth, SensorHealth } from "@/api/machineHealth";
import { layoutFor, slotLabel, type SlotKey } from "./machineLayout";
import {
  STATUS_LABEL,
  ago,
  fmtBattery,
  fmtRms,
  fmtTemp,
  sensorColorMap,
  sensorFinding,
  shortSensorName,
  statusColor,
} from "./machineUi";
import { Panel } from "./widgets/WidgetCard";

interface Group {
  title: string;
  sensors: SensorHealth[];
}

/**
 * The sensors of a machine as rounded cards, grouped as on the machine: the motor's two (outboard,
 * coupling side) and the driven part's two. Selection is shared with the picture.
 */
export default function SensorCards({
  m,
  selectedId,
  onSelect,
}: {
  m: MachineHealth;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { groups, where } = useMemo(() => {
    const layout = layoutFor(m.sensors);
    const where = new Map<string, string>();
    const groups: Group[] = [];
    if (layout) {
      const take = (keys: SlotKey[]) => {
        const out: SensorHealth[] = [];
        for (const key of keys) {
          for (const p of layout.slots[key] ?? []) {
            out.push(p.sensor);
            where.set(p.sensor.sensor_id, slotLabel(key, layout.template));
          }
        }
        return out;
      };
      const motor = take(["MOTOR-NDE", "MOTOR-DE"]);
      const driven = take(["DRIVEN-DE", "DRIVEN-NDE"]);
      if (motor.length) groups.push({ title: "Motor", sensors: motor });
      if (driven.length) groups.push({ title: layout.template.drivenName, sensors: driven });
      if (layout.unplaced.length) groups.push({ title: "Position not set", sensors: layout.unplaced });
    } else {
      groups.push({ title: "Sensors", sensors: m.sensors });
    }
    return { groups, where };
  }, [m.sensors]);

  // each sensor's own colour: the frame here, the line in the history chart, the ring in the picture
  const colors = useMemo(() => sensorColorMap(m.sensors), [m.sensors]);
  const short = (name: string) => shortSensorName(name, m.machine_no);

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g) => (
        <Panel key={g.title} title={g.title}>
          <div className="grid grid-cols-2 gap-2">
            {g.sensors.map((s) => {
              const color = statusColor(s.status, s.level);
              const own = colors.get(s.sensor_id) ?? "#60a5fa";
              const selected = s.sensor_id === selectedId;
              const finding = sensorFinding(s);
              const r = s.reading;
              return (
                <div
                  key={s.sensor_id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(selected ? null : s.sensor_id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(selected ? null : s.sensor_id);
                    }
                  }}
                  className="flex min-w-0 cursor-pointer flex-col rounded-xl border-2 p-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70"
                  style={{
                    borderColor: selected ? own : `${own}80`,
                    background: selected ? `${own}1f` : `${own}0d`,
                    boxShadow: selected ? `0 0 14px ${own}66` : "none",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-xs font-medium text-gray-100" title={s.name}>
                      {short(s.name)}
                    </span>
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                      title={STATUS_LABEL[s.status]}
                    />
                  </div>
                  <div className="truncate text-[11px] text-gray-500">
                    {where.get(s.sensor_id) ?? "Position not set"} · {ago(s.last_reading_at)}
                  </div>

                  <div className="mt-1 min-h-[16px] truncate text-xs font-medium" style={{ color }}>
                    {finding || STATUS_LABEL[s.status]}
                  </div>

                  {r ? (
                    <>
                      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
                        {(
                          [
                            ["H", r.rms_h],
                            ["V", r.rms_v],
                            ["A", r.rms_a],
                          ] as const
                        ).map(([axis, v]) => (
                          <div key={axis} className="rounded-lg bg-[#162033] py-1">
                            <div className="text-[10px] leading-none text-gray-500">{axis}</div>
                            <div className="text-sm font-semibold leading-tight text-gray-100">{fmtRms(v)}</div>
                            <div className="text-[9px] leading-none text-gray-500">mm/s</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-xs text-gray-300">
                        <span>{fmtTemp(r.temperature)} °C</span>
                        <span>{fmtBattery(r.battery)} % batt.</span>
                      </div>
                    </>
                  ) : (
                    <div className="mt-2 text-xs text-gray-500">No reading yet</div>
                  )}

                  <Link
                    href={`/sensors/${s.sensor_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 self-start text-[11px] text-blue-300 hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              );
            })}
          </div>
        </Panel>
      ))}
    </div>
  );
}
