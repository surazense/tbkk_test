"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Save, Eye, Undo2, Wand2, Ruler, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  updateSensorThresholds,
  getThresholdOverview,
  previewThresholds,
  type Level,
  type PreviewRow,
  type SensorThresholdRow,
  type Triple,
} from "@/api/settings/thresholdBulk";
import {
  getAllMachineClasses,
  getMachineClassInfo,
} from "@/lib/iso10816-3";

/** Draft = what the user changed but has not saved yet. */
interface Draft extends Triple {
  machine_class: string | null;
}

const LEVEL_STYLE: Record<Level, { label: string; dot: string }> = {
  0: { label: "ปกติ", dot: "bg-emerald-500" },
  1: { label: "เฝ้าระวัง", dot: "bg-yellow-400" },
  2: { label: "เตือน", dot: "bg-orange-500" },
  3: { label: "วิกฤต", dot: "bg-red-500" },
};

const r1 = (v: number) => Math.round(v * 10) / 10;

function level(rms: number | null, t: Triple): Level | null {
  if (rms === null) return null;
  if (rms >= t.threshold_max) return 3;
  if (rms >= t.threshold_medium) return 2;
  if (rms >= t.threshold_min) return 1;
  return 0;
}

/** ISO 10816-3 class -> thresholds (warning/concern/critical = min/medium/max). */
function isoTriple(classCode: string | null): Triple | null {
  if (!classCode) return null;
  const code = parseInt(classCode, 10);
  const info = getAllMachineClasses().find((c) => c.code === code);
  if (!info) return null;
  return {
    threshold_min: info.thresholds.warning,
    threshold_medium: info.thresholds.concern,
    threshold_max: info.thresholds.critical,
  };
}

/** Baseline suggestion can only TIGHTEN the ISO limits, never loosen them. */
function capByIso(s: Triple, iso: Triple | null): Triple {
  const t = iso
    ? {
        threshold_min: Math.min(s.threshold_min, iso.threshold_min),
        threshold_medium: Math.min(s.threshold_medium, iso.threshold_medium),
        threshold_max: Math.min(s.threshold_max, iso.threshold_max),
      }
    : { ...s };
  if (t.threshold_medium <= t.threshold_min) t.threshold_medium = r1(t.threshold_min + 0.1);
  if (t.threshold_max <= t.threshold_medium) t.threshold_max = r1(t.threshold_medium + 0.1);
  return t;
}

function validTriple(t: Triple): boolean {
  return (
    Number.isFinite(t.threshold_min) &&
    t.threshold_min > 0 &&
    t.threshold_min < t.threshold_medium &&
    t.threshold_medium < t.threshold_max
  );
}

const tripleKey = (t: Triple, cls: string | null) =>
  `${t.threshold_min}|${t.threshold_medium}|${t.threshold_max}|${cls ?? ""}`;

/** Where the recent readings sit against the three limits. */
function RangeBar({ row, t }: { row: SensorThresholdRow; t: Triple }) {
  const top = Math.max(t.threshold_max * 1.25, row.peak ?? 0, 0.1);
  const pct = (v: number) => `${Math.min(100, (v / top) * 100)}%`;
  return (
    <div
      className="relative h-3 w-full min-w-[120px] rounded bg-[#1e293b] overflow-hidden"
      title={`p50 ${row.p50?.toFixed(2) ?? "-"} · p95 ${row.p95?.toFixed(2) ?? "-"} · สูงสุด ${row.peak?.toFixed(2) ?? "-"} mm/s`}
    >
      <div className="absolute inset-y-0 bg-yellow-500/30" style={{ left: pct(t.threshold_min), width: `calc(${pct(t.threshold_medium)} - ${pct(t.threshold_min)})` }} />
      <div className="absolute inset-y-0 bg-orange-500/30" style={{ left: pct(t.threshold_medium), width: `calc(${pct(t.threshold_max)} - ${pct(t.threshold_medium)})` }} />
      <div className="absolute inset-y-0 bg-red-500/30 right-0" style={{ left: pct(t.threshold_max) }} />
      {row.p95 !== null && (
        <div className="absolute inset-y-0 left-0 bg-blue-400/70" style={{ width: pct(row.p95) }} />
      )}
      {row.peak !== null && (
        <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: pct(row.peak) }} />
      )}
    </div>
  );
}

export default function ThresholdManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<SensorThresholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState(7);

  const [search, setSearch] = useState("");
  const [machineFilter, setMachineFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "alarming" | "changed" | "default">("all");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [impact, setImpact] = useState<Record<string, PreviewRow>>({});
  const [previewing, setPreviewing] = useState(false);

  // manual bulk inputs
  const [manual, setManual] = useState({ min: "", med: "", max: "" });
  const [bulkClass, setBulkClass] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getThresholdOverview(days);
      setRows(data.sensors);
    } catch {
      toast({ title: "โหลดข้อมูลไม่สำเร็จ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => {
    load();
  }, [load]);

  // effective values = draft over stored
  const eff = useCallback(
    (r: SensorThresholdRow): Draft =>
      drafts[r.id] ?? {
        threshold_min: r.threshold_min,
        threshold_medium: r.threshold_medium,
        threshold_max: r.threshold_max,
        machine_class: r.machine_class,
      },
    [drafts]
  );

  const machines = useMemo(
    () => Array.from(new Set(rows.map((r) => r.machine ?? "(ไม่ระบุเครื่อง)"))).sort(),
    [rows]
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const m = r.machine ?? "(ไม่ระบุเครื่อง)";
      if (machineFilter && m !== machineFilter) return false;
      if (q && !`${r.name} ${m} ${r.machine_no ?? ""} ${r.area ?? ""} ${r.installed_point ?? ""}`.toLowerCase().includes(q)) return false;
      if (statusFilter === "alarming" && !((level(r.latest_rms, eff(r)) ?? 0) > 0)) return false;
      if (statusFilter === "changed" && !drafts[r.id]) return false;
      if (statusFilter === "default" && !r.is_default) return false;
      return true;
    });
  }, [rows, search, machineFilter, statusFilter, drafts, eff]);

  const groups = useMemo(() => {
    const g = new Map<string, SensorThresholdRow[]>();
    for (const r of visible) {
      const k = r.machine ?? "(ไม่ระบุเครื่อง)";
      if (!g.has(k)) g.set(k, []);
      g.get(k)!.push(r);
    }
    return Array.from(g.entries());
  }, [visible]);

  const counts = useMemo(() => {
    const c = [0, 0, 0, 0];
    for (const r of rows) {
      const l = level(r.latest_rms, eff(r));
      if (l !== null) c[l]++;
    }
    return c;
  }, [rows, eff]);

  const setDraft = (ids: string[], patch: (r: SensorThresholdRow, cur: Draft) => Draft | null) => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        const r = rows.find((x) => x.id === id);
        if (!r) continue;
        const cur = next[id] ?? {
          threshold_min: r.threshold_min,
          threshold_medium: r.threshold_medium,
          threshold_max: r.threshold_max,
          machine_class: r.machine_class,
        };
        const d = patch(r, cur);
        if (d) next[id] = d;
      }
      return next;
    });
    setImpact({});
  };

  const toggle = (ids: string[], on: boolean) =>
    setSelected((prev) => {
      const n = new Set(prev);
      ids.forEach((id) => (on ? n.add(id) : n.delete(id)));
      return n;
    });

  const selIds = Array.from(selected);

  const applyIso = (cls: string) => {
    const t = isoTriple(cls);
    if (!t) return;
    setDraft(selIds, (_r, cur) => ({ ...cur, ...t, machine_class: cls }));
  };

  const applyBaseline = () => {
    let skipped = 0;
    setDraft(selIds, (r, cur) => {
      if (!r.suggested) {
        skipped++;
        return null;
      }
      return { ...cur, ...capByIso(r.suggested, isoTriple(cur.machine_class)) };
    });
    if (skipped > 0)
      toast({ title: `ข้าม ${skipped} เซนเซอร์`, description: "ข้อมูลย้อนหลังยังไม่พอสำหรับค่าแนะนำ (ต้องมี ≥ 100 ค่า)" });
  };

  const applyManual = () => {
    const t: Triple = {
      threshold_min: parseFloat(manual.min),
      threshold_medium: parseFloat(manual.med),
      threshold_max: parseFloat(manual.max),
    };
    if (!validTriple(t)) {
      toast({ title: "ค่าไม่ถูกต้อง", description: "ต้องเป็น 0 < ต่ำ < กลาง < สูง (mm/s)", variant: "destructive" });
      return;
    }
    setDraft(selIds, (_r, cur) => ({ ...cur, ...t }));
  };

  const changedIds = Object.keys(drafts);
  const invalidIds = changedIds.filter((id) => !validTriple(drafts[id]));

  /** Sensors with identical values go in one request: 100 ISO-class sensors = a handful of calls. */
  const batches = useMemo(() => {
    const m = new Map<string, { ids: string[]; d: Draft }>();
    for (const id of changedIds) {
      const d = drafts[id];
      const k = tripleKey(d, d.machine_class);
      if (!m.has(k)) m.set(k, { ids: [], d });
      m.get(k)!.ids.push(id);
    }
    return Array.from(m.values());
  }, [changedIds, drafts]);

  const runPreview = async () => {
    setPreviewing(true);
    try {
      const out: Record<string, PreviewRow> = {};
      for (const b of batches) {
        const res = await previewThresholds(b.ids, b.d, days);
        res.forEach((p) => (out[p.sensor_id] = p));
      }
      setImpact(out);
    } catch {
      toast({ title: "พรีวิวไม่สำเร็จ", variant: "destructive" });
    } finally {
      setPreviewing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      let n = 0;
      for (const b of batches) {
        n += await updateSensorThresholds(b.ids, b.d, b.d.machine_class);
      }
      if (n < changedIds.length) {
        toast({
          title: `บันทึกสำเร็จ ${n} จาก ${changedIds.length} เซนเซอร์`,
          description: "ที่เหลือบันทึกไม่ได้ (อาจไม่มีสิทธิ์ editor) ลองใหม่อีกครั้ง",
          variant: "destructive",
        });
      } else {
        toast({ title: `บันทึกแล้ว ${n} เซนเซอร์` });
      }
      setDrafts({});
      setImpact({});
      await load();
    } catch {
      toast({ title: "บันทึกไม่สำเร็จ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const input = "w-16 rounded bg-[#0B1121] border border-[#374151] px-1.5 py-1 text-xs text-white text-right focus:outline-none focus:border-blue-500";
  const sel = "rounded bg-[#0B1121] border border-[#374151] px-2 py-1.5 text-xs text-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-28">
      {/* status summary */}
      <div className="flex flex-wrap gap-2 text-xs text-white">
        {([0, 1, 2, 3] as Level[]).map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5 rounded-full bg-[#111827] border border-[#374151] px-3 py-1">
            <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE[l].dot}`} />
            {LEVEL_STYLE[l].label} {counts[l]}
          </span>
        ))}
        <span className="text-gray-400 self-center">
          จากค่าล่าสุดของ {rows.length} เซนเซอร์ (ค่า Velocity RMS สูงสุดของ 3 แกน, mm/s)
        </span>
      </div>

      {/* filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input className={`${sel} w-56`} placeholder="ค้นหา เซนเซอร์ / เครื่อง / จุดติดตั้ง" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={sel} value={machineFilter} onChange={(e) => setMachineFilter(e.target.value)}>
          <option value="">ทุกเครื่อง</option>
          {machines.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select className={sel} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
          <option value="all">ทั้งหมด</option>
          <option value="alarming">เกินเกณฑ์อยู่ตอนนี้</option>
          <option value="changed">ที่แก้ไขแล้วยังไม่บันทึก</option>
          <option value="default">ยังไม่เคยตั้งค่า (ใช้ค่าเริ่มต้น)</option>
        </select>
        <select className={sel} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[1, 7, 14, 30].map((d) => <option key={d} value={d}>ข้อมูลย้อนหลัง {d} วัน</option>)}
        </select>
        <button className="text-xs text-blue-400 hover:underline" onClick={() => toggle(visible.map((r) => r.id), true)}>
          เลือกทั้งหมดที่แสดง ({visible.length})
        </button>
        {selected.size > 0 && (
          <button className="text-xs text-gray-400 hover:underline" onClick={() => setSelected(new Set())}>
            ล้างที่เลือก
          </button>
        )}
      </div>

      {/* table */}
      <div className="overflow-x-auto rounded-lg border border-[#374151] bg-[#111827]">
        <table className="w-full text-xs text-white">
          <thead className="bg-[#1e293b] text-gray-300">
            <tr>
              <th className="w-8 p-2" />
              <th className="p-2 text-left">เซนเซอร์</th>
              <th className="p-2 text-left">คลาส ISO 10816-3</th>
              <th className="p-2 text-right" title="เริ่มเฝ้าระวัง">ต่ำ</th>
              <th className="p-2 text-right" title="เตือน">กลาง</th>
              <th className="p-2 text-right" title="วิกฤต">สูง</th>
              <th className="p-2 text-left">ค่าจริงย้อนหลัง ({days} วัน)</th>
              <th className="p-2 text-right">ล่าสุด</th>
              <th className="p-2 text-right">ถ้าใช้ค่านี้</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([machine, list]) => {
              const ids = list.map((r) => r.id);
              const allOn = ids.every((id) => selected.has(id));
              return (
                <GroupRows key={machine}>
                  <tr className="bg-[#0f172a]">
                    <td className="p-2">
                      <input type="checkbox" checked={allOn} onChange={(e) => toggle(ids, e.target.checked)} />
                    </td>
                    <td colSpan={8} className="p-2 font-semibold text-gray-200">
                      {machine} <span className="text-gray-500 font-normal">· {list.length} จุดวัด</span>
                    </td>
                  </tr>
                  {list.map((r) => {
                    const d = eff(r);
                    const dirty = !!drafts[r.id];
                    const bad = dirty && !validTriple(d);
                    const lv = level(r.latest_rms, d);
                    const imp = impact[r.id];
                    return (
                      <tr key={r.id} className={`border-t border-[#1f2937] ${dirty ? "bg-blue-500/5" : ""}`}>
                        <td className="p-2">
                          <input type="checkbox" checked={selected.has(r.id)} onChange={(e) => toggle([r.id], e.target.checked)} />
                        </td>
                        <td className="p-2">
                          <div className="font-medium">{r.name}</div>
                          <div className="text-gray-500">{r.installed_point ?? r.area ?? ""}</div>
                        </td>
                        <td className="p-2">
                          <select
                            className={`${sel} max-w-[190px]`}
                            value={d.machine_class ?? ""}
                            onChange={(e) => {
                              const cls = e.target.value || null;
                              const t = isoTriple(cls);
                              setDraft([r.id], (_x, cur) => ({ ...cur, ...(t ?? {}), machine_class: cls }));
                            }}
                          >
                            <option value="">— ไม่ระบุ —</option>
                            {getAllMachineClasses().map((c) => (
                              <option key={c.id} value={String(c.code)}>{c.code}. {c.baseName ?? c.name}</option>
                            ))}
                          </select>
                        </td>
                        {(["threshold_min", "threshold_medium", "threshold_max"] as const).map((k) => (
                          <td key={k} className="p-2 text-right">
                            <input
                              className={`${input} ${bad ? "border-red-500" : ""} ${r.is_default && !dirty ? "italic text-gray-400" : ""}`}
                              type="number" step="0.1" min="0"
                              value={d[k]}
                              onChange={(e) => {
                                const v = parseFloat(e.target.value);
                                setDraft([r.id], (_x, cur) => ({ ...cur, [k]: Number.isNaN(v) ? 0 : v }));
                              }}
                            />
                          </td>
                        ))}
                        <td className="p-2 w-44"><RangeBar row={r} t={d} /></td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {r.latest_rms === null ? <span className="text-gray-500">-</span> : (
                            <span className="inline-flex items-center gap-1.5">
                              {r.latest_rms.toFixed(2)}
                              {lv !== null && <span className={`h-2 w-2 rounded-full ${LEVEL_STYLE[lv].dot}`} title={LEVEL_STYLE[lv].label} />}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-right whitespace-nowrap">
                          {imp ? (
                            <span title={`เฝ้าระวัง ${imp.concern} · เตือน ${imp.warning} · วิกฤต ${imp.critical} จาก ${imp.samples} ค่า`}>
                              {imp.concern + imp.warning + imp.critical}
                              <span className="text-gray-500"> / {imp.samples}</span>
                            </span>
                          ) : <span className="text-gray-600">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </GroupRows>
              );
            })}
            {groups.length === 0 && (
              <tr><td colSpan={9} className="p-6 text-center text-gray-500">ไม่พบเซนเซอร์</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-gray-500">
        แถบ: สีน้ำเงิน = p95 ของค่าจริง, เส้นขาว = ค่าสูงสุด, พื้นสีเหลือง/ส้ม/แดง = ช่วงเฝ้าระวัง/เตือน/วิกฤต ·
        คอลัมน์ &quot;ถ้าใช้ค่านี้&quot; = จำนวนค่าที่จะเกินเกณฑ์ / จำนวนค่าทั้งหมด (กดพรีวิวก่อนบันทึก)
      </p>

      {/* action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#374151] bg-[#0B1121]/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center gap-3 text-xs text-white">
          <span className="font-semibold">เลือก {selected.size}</span>

          <span className="inline-flex items-center gap-1">
            <Ruler size={14} className="text-gray-400" />
            <select className={sel} value={bulkClass} onChange={(e) => setBulkClass(e.target.value)} disabled={selected.size === 0}>
              <option value="">ตั้งตามคลาส ISO…</option>
              {getAllMachineClasses().map((c) => (
                <option key={c.id} value={String(c.code)}>{c.code}. {c.baseName ?? c.name} ({c.thresholds.warning}/{c.thresholds.concern}/{c.thresholds.critical})</option>
              ))}
            </select>
            <Button size="sm" variant="secondary" disabled={selected.size === 0 || !bulkClass} onClick={() => applyIso(bulkClass)}>ใช้</Button>
          </span>

          <Button size="sm" variant="secondary" disabled={selected.size === 0} onClick={applyBaseline} title="ดูจากข้อมูลจริงของแต่ละตัว แต่ไม่เกินเกณฑ์ ISO ของคลาสนั้น">
            <Wand2 size={14} className="mr-1" /> แนะนำจากข้อมูลจริง
          </Button>

          <span className="inline-flex items-center gap-1">
            <PencilLine size={14} className="text-gray-400" />
            <input className={input} placeholder="ต่ำ" value={manual.min} onChange={(e) => setManual({ ...manual, min: e.target.value })} />
            <input className={input} placeholder="กลาง" value={manual.med} onChange={(e) => setManual({ ...manual, med: e.target.value })} />
            <input className={input} placeholder="สูง" value={manual.max} onChange={(e) => setManual({ ...manual, max: e.target.value })} />
            <Button size="sm" variant="secondary" disabled={selected.size === 0} onClick={applyManual}>ใช้</Button>
          </span>

          <span className="ml-auto inline-flex items-center gap-2">
            {changedIds.length > 0 && <span className="text-blue-300">แก้ไขแล้ว {changedIds.length} ตัว</span>}
            <Button size="sm" variant="ghost" disabled={changedIds.length === 0} onClick={() => { setDrafts({}); setImpact({}); }}>
              <Undo2 size={14} className="mr-1" /> ยกเลิก
            </Button>
            <Button size="sm" variant="secondary" disabled={changedIds.length === 0 || invalidIds.length > 0 || previewing} onClick={runPreview}>
              {previewing ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Eye size={14} className="mr-1" />} พรีวิวผล
            </Button>
            <Button size="sm" disabled={changedIds.length === 0 || invalidIds.length > 0 || saving} onClick={save}>
              {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />} บันทึก
            </Button>
          </span>
        </div>
        {invalidIds.length > 0 && (
          <p className="mx-auto max-w-7xl mt-1 text-[11px] text-red-400">
            {invalidIds.length} ตัวมีค่าไม่ถูกต้อง (ต้อง 0 &lt; ต่ำ &lt; กลาง &lt; สูง)
          </p>
        )}
      </div>
    </div>
  );
}

/** Fragment wrapper so a group header row and its rows share one key. */
function GroupRows({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
