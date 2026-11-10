"use client";

import { useMemo, useState } from "react";
import { X, Search, LayoutGrid, Table2, AlertTriangle } from "lucide-react";

/** MOCK DATA ONLY: layout preview for the machine-card view, nothing is fetched or saved. */

type Level = 0 | 1 | 2 | 3;
interface Triple { min: number; med: number; max: number }
interface MockSensor { name: string; rms: number; p95: number; peak: number }
interface MockMachine {
  id: string;
  name: string;
  no: string;
  area: string;
  cls: string;
  t: Triple;
  fault: string | null;
  ageMin: number;
  sensors: MockSensor[];
}

const ISO: Record<string, Triple> = {
  "Class I (เล็ก)": { min: 0.7, med: 1.8, max: 4.5 },
  "Class II (กลาง)": { min: 1.4, med: 2.8, max: 7.1 },
  "Class III (ใหญ่)": { min: 2.3, med: 4.5, max: 7.1 },
};

const S = (name: string, rms: number, p95: number, peak: number): MockSensor => ({ name, rms, p95, peak });

const MACHINES: MockMachine[] = [
  { id: "1", name: "Pump Line 2", no: "D09", area: "Plant 1", cls: "Class III (ใหญ่)", t: ISO["Class III (ใหญ่)"], fault: "Unbalance", ageMin: 2,
    sensors: [S("MOTOR-NDE", 0.4, 0.6, 1.1), S("MOTOR-DE", 1.9, 2.1, 3.0), S("PUMP-DE", 6.1, 4.2, 6.4), S("PUMP-NDE", 0.8, 1.0, 1.6)] },
  { id: "2", name: "Cooling Fan A", no: "D12", area: "Plant 1", cls: "Class II (กลาง)", t: ISO["Class II (กลาง)"], fault: "Bearing", ageMin: 3,
    sensors: [S("MOTOR-DE", 7.8, 3.9, 7.9), S("FAN-DE", 3.1, 2.4, 4.0), S("FAN-NDE", 2.0, 1.7, 3.1)] },
  { id: "3", name: "Compressor 1", no: "C01", area: "Plant 2", cls: "Class III (ใหญ่)", t: ISO["Class III (ใหญ่)"], fault: null, ageMin: 1,
    sensors: [S("MOTOR-NDE", 0.9, 1.2, 1.8), S("MOTOR-DE", 1.1, 1.3, 2.2), S("COMP-DE", 1.8, 2.0, 3.1), S("COMP-NDE", 1.2, 1.5, 2.4)] },
  { id: "4", name: "Conveyor Drive", no: "V03", area: "Plant 2", cls: "Class I (เล็ก)", t: ISO["Class I (เล็ก)"], fault: "Misalignment", ageMin: 4,
    sensors: [S("MOTOR-DE", 2.2, 1.4, 2.9), S("GEARBOX", 1.0, 0.9, 1.5)] },
  { id: "5", name: "Pump Line 1", no: "D08", area: "Plant 1", cls: "Class III (ใหญ่)", t: ISO["Class III (ใหญ่)"], fault: null, ageMin: 2,
    sensors: [S("MOTOR-NDE", 0.5, 0.7, 1.2), S("MOTOR-DE", 0.7, 0.9, 1.5), S("PUMP-DE", 1.3, 1.6, 2.4), S("PUMP-NDE", 0.9, 1.1, 1.7)] },
  { id: "6", name: "Blower B", no: "B02", area: "Plant 3", cls: "Class II (กลาง)", t: ISO["Class II (กลาง)"], fault: null, ageMin: 190,
    sensors: [S("MOTOR-DE", 0.6, 0.8, 1.2), S("BLOWER-DE", 0.9, 1.1, 1.8)] },
  { id: "7", name: "Mixer Tank 4", no: "M04", area: "Plant 3", cls: "Class I (เล็ก)", t: ISO["Class I (เล็ก)"], fault: "Looseness", ageMin: 5,
    sensors: [S("MOTOR-DE", 1.0, 0.8, 1.6), S("MIXER-DE", 2.6, 1.5, 2.8), S("MIXER-NDE", 0.6, 0.6, 1.0)] },
  { id: "8", name: "Chiller Pump", no: "D15", area: "Plant 1", cls: "Class III (ใหญ่)", t: ISO["Class III (ใหญ่)"], fault: null, ageMin: 2,
    sensors: [S("MOTOR-NDE", 0.3, 0.5, 0.9), S("MOTOR-DE", 0.5, 0.6, 1.0), S("PUMP-DE", 0.8, 1.0, 1.5), S("PUMP-NDE", 0.6, 0.7, 1.1)] },
];

const LEVEL: Record<Level, { label: string; text: string; dot: string; ring: string }> = {
  0: { label: "ปกติ", text: "text-emerald-400", dot: "bg-emerald-500", ring: "border-[#1e293b]" },
  1: { label: "เฝ้าระวัง", text: "text-yellow-300", dot: "bg-yellow-400", ring: "border-yellow-500/60" },
  2: { label: "เตือน", text: "text-orange-400", dot: "bg-orange-500", ring: "border-orange-500/70" },
  3: { label: "วิกฤต", text: "text-red-400", dot: "bg-red-500", ring: "border-red-500/80" },
};

const lvl = (v: number, t: Triple): Level => (v >= t.max ? 3 : v >= t.med ? 2 : v >= t.min ? 1 : 0);

function machineLevel(m: MockMachine): Level {
  return Math.max(...m.sensors.map((s) => lvl(s.rms, m.t))) as Level;
}

/** Same bar as the table view: p95 fill, peak marker, threshold zones. */
function Bar({ s, t }: { s: MockSensor; t: Triple }) {
  const top = Math.max(t.max * 1.25, s.peak);
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  return (
    <div className="relative h-2.5 w-full rounded bg-[#1e293b] overflow-hidden">
      <div className="absolute inset-y-0 bg-yellow-500/30" style={{ left: pct(t.min), width: `calc(${pct(t.med)} - ${pct(t.min)})` }} />
      <div className="absolute inset-y-0 bg-orange-500/30" style={{ left: pct(t.med), width: `calc(${pct(t.max)} - ${pct(t.med)})` }} />
      <div className="absolute inset-y-0 bg-red-500/30 right-0" style={{ left: pct(t.max) }} />
      <div className="absolute inset-y-0 left-0 bg-blue-400/70" style={{ width: pct(s.p95) }} />
      <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: pct(s.peak) }} />
    </div>
  );
}

function MachineCard({ m, onOpen }: { m: MockMachine; onOpen: () => void }) {
  const L = machineLevel(m);
  const stale = m.ageMin > 60;
  return (
    <button
      onClick={onOpen}
      className={`text-left rounded-lg border-2 ${LEVEL[L].ring} bg-[#111827] p-4 hover:bg-[#162033] transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-white font-semibold leading-tight">{m.name}</div>
          <div className="text-xs text-gray-400">{m.no} · {m.area}</div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${LEVEL[L].text}`}>
          <span className={`h-2.5 w-2.5 rounded-full ${LEVEL[L].dot}`} />
          {LEVEL[L].label}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {m.sensors.map((s) => {
          const sl = lvl(s.rms, m.t);
          return (
            <div key={s.name}>
              <div className="flex justify-between text-[11px] text-gray-300 mb-0.5">
                <span>{s.name}</span>
                <span className={`tabular-nums ${sl > 0 ? LEVEL[sl].text : ""}`}>{s.rms.toFixed(1)} mm/s</span>
              </div>
              <Bar s={s} t={m.t} />
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {m.fault && L > 0 ? (
          <span className="inline-flex items-center gap-1 text-orange-300">
            <AlertTriangle className="h-3.5 w-3.5" /> น่าจะเป็น {m.fault}
          </span>
        ) : (
          <span className="text-gray-500">ไม่พบความผิดปกติ</span>
        )}
        <span className={stale ? "text-yellow-400" : "text-gray-500"}>
          {stale ? `ไม่มีข้อมูล ${Math.round(m.ageMin / 60)} ชม.` : `${m.ageMin} นาทีที่แล้ว`}
        </span>
      </div>
      <div className="mt-2 pt-2 border-t border-[#1e293b] text-[11px] text-gray-500">
        {m.cls} · เกณฑ์ {m.t.min} / {m.t.med} / {m.t.max}
      </div>
    </button>
  );
}

function Drawer({ m, onClose }: { m: MockMachine; onClose: () => void }) {
  const [cls, setCls] = useState(m.cls);
  const t = ISO[cls];
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div className="h-full w-full max-w-md bg-[#0f172a] border-l border-[#1e293b] p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-white">{m.name}</div>
            <div className="text-xs text-gray-400">{m.no} · {m.area} · {m.sensors.length} จุดวัด</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 text-xs text-gray-400">ตั้งเกณฑ์ทั้งเครื่องตามคลาส ISO 10816-3</div>
        <select value={cls} onChange={(e) => setCls(e.target.value)} className="mt-1 w-full rounded bg-[#111827] border border-[#1e293b] text-white text-sm p-2">
          {Object.keys(ISO).map((k) => <option key={k}>{k}</option>)}
        </select>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {([["เฝ้าระวัง", t.min, "text-yellow-300"], ["เตือน", t.med, "text-orange-400"], ["วิกฤต", t.max, "text-red-400"]] as const).map(([l, v, c]) => (
            <div key={l} className="rounded bg-[#111827] border border-[#1e293b] p-2">
              <div className={`text-[11px] ${c}`}>{l}</div>
              <div className="text-white font-semibold">{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <button className="flex-1 rounded border border-[#1e293b] text-xs text-gray-200 py-1.5 hover:bg-[#162033]">แนะนำจากข้อมูลจริง</button>
          <button className="flex-1 rounded border border-[#1e293b] text-xs text-gray-200 py-1.5 hover:bg-[#162033]">พรีวิวผล</button>
        </div>
        <div className="mt-2 rounded bg-[#111827] border border-[#1e293b] p-2 text-xs text-gray-300">
          พรีวิว (7 วัน): ถ้าใช้เกณฑ์นี้จะเตือน <b className="text-orange-300">38</b> จาก 20,160 ค่า
        </div>

        <div className="mt-5 text-xs text-gray-400">รายเซนเซอร์ (แก้ได้ถ้ามีข้อยกเว้น)</div>
        <div className="mt-1 space-y-2">
          {m.sensors.map((s) => (
            <div key={s.name} className="rounded bg-[#111827] border border-[#1e293b] p-2">
              <div className="flex justify-between text-xs text-gray-200 mb-1">
                <span>{s.name}</span><span className="tabular-nums">{s.rms.toFixed(1)} mm/s</span>
              </div>
              <Bar s={s} t={t} />
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {[t.min, t.med, t.max].map((v, i) => (
                  <input key={i} defaultValue={v} className="w-full rounded bg-[#0f172a] border border-[#1e293b] text-white text-xs p-1 text-center" />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded border border-[#1e293b] text-sm text-gray-200 py-2">ยกเลิก</button>
          <button className="flex-1 rounded bg-blue-600 text-sm text-white py-2 hover:bg-blue-500">บันทึกทั้งเครื่อง</button>
        </div>
      </div>
    </div>
  );
}

export default function MachineCardsMock() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [only, setOnly] = useState<Level | "all">("all");
  const [open, setOpen] = useState<MockMachine | null>(null);

  const counts = useMemo(() => {
    const c = [0, 0, 0, 0];
    MACHINES.forEach((m) => c[machineLevel(m)]++);
    return c;
  }, []);

  const list = MACHINES
    .filter((m) => (area ? m.area === area : true))
    .filter((m) => (only === "all" ? true : machineLevel(m) === only))
    .filter((m) => `${m.name} ${m.no}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => machineLevel(b) - machineLevel(a));

  return (
    <div className="space-y-4">
      <div className="rounded border border-yellow-500/40 bg-yellow-500/10 text-yellow-200 text-xs px-3 py-2">
        ตัวอย่างหน้าตาด้วยข้อมูลจำลอง ยังไม่ได้ดึงข้อมูลจริงและบันทึกไม่ได้
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {([3, 2, 1, 0] as Level[]).map((l) => (
          <button
            key={l}
            onClick={() => setOnly(only === l ? "all" : l)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${only === l ? "border-white/60 bg-white/10" : "border-[#1e293b] bg-[#111827]"} text-gray-100`}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${LEVEL[l].dot}`} />
            {LEVEL[l].label} <b>{counts[l]}</b> เครื่อง
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-gray-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาเครื่อง / รหัส"
            className="rounded bg-[#111827] border border-[#1e293b] text-white text-sm pl-8 pr-2 py-1.5 w-52" />
        </div>
        <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded bg-[#111827] border border-[#1e293b] text-white text-sm p-1.5">
          <option value="">ทุกพื้นที่</option>
          {["Plant 1", "Plant 2", "Plant 3"].map((a) => <option key={a}>{a}</option>)}
        </select>
        <span className="text-xs text-gray-500">เรียงเครื่องที่แย่สุดก่อน</span>
        <div className="ml-auto inline-flex rounded border border-[#1e293b] overflow-hidden text-sm">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white"><LayoutGrid className="h-4 w-4" /> การ์ด</span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#111827] text-gray-300"><Table2 className="h-4 w-4" /> ตาราง</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((m) => <MachineCard key={m.id} m={m} onOpen={() => setOpen(m)} />)}
      </div>
      {list.length === 0 && <div className="text-gray-500 text-sm py-10 text-center">ไม่พบเครื่อง</div>}

      {open && <Drawer m={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
