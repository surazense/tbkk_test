import type { LatestReading, MachineEvent, MachineHealth, MachineStatus, SensorHealth } from "@/api/machineHealth";
import type { SensorStatusType } from "@/components/Dashboard/SensorStatusSummary";

export const STATUS_LABEL: Record<MachineStatus, string> = {
  problem: "Fault detected",
  offline: "Lost",
  ok: "Normal",
  no_data: "No data yet",
};

export const STATUS_TAG: Record<MachineStatus, string> = {
  problem: "bg-orange-500/15 text-orange-300",
  offline: "bg-gray-500/20 text-gray-300",
  ok: "bg-emerald-500/15 text-emerald-300",
  no_data: "bg-gray-500/10 text-gray-400",
};

/** Same palette as the sensor cards on the home page: normal, concern, warning, critical. */
export const LEVEL_COLOR = ["#72ff82", "#ffd84d", "#ff8c1a", "#ff4d4d"];
export const LEVEL_NAME = ["Normal", "Warning", "Concern", "Critical"];
const DIM = "#404040";

export function statusColor(status: MachineStatus, level: number): string {
  if (status === "offline" || status === "no_data") return DIM;
  if (status === "problem") return LEVEL_COLOR[Math.min(3, Math.max(1, level))];
  return LEVEL_COLOR[0];
}

const EVENT_LABEL: Record<string, string> = {
  new: "Fault detected",
  worsened: "Fault worsened",
  changed: "Fault changed",
  cleared: "Back to normal",
  offline: "Sensor stopped reporting",
  online: "Sensor reporting again",
};

/** "UNBALANCE" -> "Unbalance", "BEARING_WEAR" -> "Bearing wear" */
export function codeName(code: string | null | undefined): string {
  if (!code) return "";
  const s = code.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function eventText(e: MachineEvent): string {
  const base = EVENT_LABEL[e.kind] ?? e.kind;
  const what = codeName(e.code);
  return what && ["new", "worsened", "changed"].includes(e.kind) ? `${base}: ${what}` : base;
}

/** What a card or the detail page says in big letters. */
export function headlineOf(m: Pick<MachineHealth, "status" | "level" | "top_finding">): string {
  switch (m.status) {
    case "problem":
      return (
        m.top_finding?.label_en ||
        codeName(m.top_finding?.code) ||
        `Vibration level: ${LEVEL_NAME[Math.min(3, Math.max(0, m.level))]}`
      );
    case "offline":
      return "No data from sensors";
    case "no_data":
      return "No data yet";
    default:
      return "No abnormality found";
  }
}

/** "5 min ago" style age. */
export function ago(iso: string | null): string {
  if (!iso) return "Never reported";
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}

/**
 * Which box of the status strip a machine counts in. Colours follow the home page:
 * yellow "warning", orange "concern", red "critical" (levels 1, 2, 3).
 */
export function summaryKey(m: Pick<MachineHealth, "status" | "level">): SensorStatusType {
  if (m.status === "offline" || m.status === "no_data") return "lost";
  if (m.status === "ok") return "normal";
  const level = Math.min(3, Math.max(1, m.level));
  return (["warning", "concern", "critical"] as const)[level - 1];
}

export function summaryCounts(machines: MachineHealth[]): Record<SensorStatusType, number> {
  const c: Record<SensorStatusType, number> = {
    normal: 0,
    warning: 0,
    concern: 0,
    critical: 0,
    standby: 0,
    lost: 0,
  };
  machines.forEach((m) => c[summaryKey(m)]++);
  return c;
}

export function machineHref(m: Pick<MachineHealth, "key">): string {
  return `/machines/${encodeURIComponent(m.key)}`;
}

const num = (v: number | null | undefined, digits: number) =>
  v == null || Number.isNaN(v) ? "-" : v.toFixed(digits);

/** Peak live values of a machine's working sensors, shown on the card. */
export function liveSummary(m: Pick<MachineHealth, "sensors">): {
  rms: number | null;
  temperature: number | null;
  working: number;
} {
  let rms: number | null = null;
  let temperature: number | null = null;
  let working = 0;
  for (const s of m.sensors) {
    if (s.status === "offline" || s.status === "no_data" || !s.reading) continue;
    working++;
    const top = Math.max(s.reading.rms_h ?? 0, s.reading.rms_v ?? 0, s.reading.rms_a ?? 0);
    rms = rms == null ? top : Math.max(rms, top);
    if (s.reading.temperature != null) {
      temperature = temperature == null ? s.reading.temperature : Math.max(temperature, s.reading.temperature);
    }
  }
  return { rms, temperature, working };
}

/**
 * One colour per sensor of a machine, the same in the history chart, the picture and the cards, so
 * a glance says which sensor a line, a dot or a card is. Assigned by sensor name, which is stable
 * (the chart used to colour by the order the server returned them).
 */
export const SENSOR_COLORS = ["#60a5fa", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#fb923c", "#22d3ee", "#e879f9"];

export function sensorColorMap(sensors: { sensor_id: string; name: string }[]): Map<string, string> {
  const sorted = [...sensors].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return new Map(sorted.map((s, i) => [s.sensor_id, SENSOR_COLORS[i % SENSOR_COLORS.length]]));
}

/** "D06_MOTOR-DE_S6" on machine D06 -> "MOTOR-DE_S6" */
export function shortSensorName(name: string, machineNo: string | null | undefined): string {
  return machineNo && name.startsWith(`${machineNo}_`) ? name.slice(machineNo.length + 1) : name;
}

/** What one sensor found, in a few words ("Unbalance 85%"); empty when it found nothing. */
export function sensorFinding(s: SensorHealth): string {
  if (s.status !== "problem") return "";
  const what = s.label_en || codeName(s.top_code) || `Vibration: ${LEVEL_NAME[Math.min(3, Math.max(0, s.level))]}`;
  return s.confidence != null && (s.label_en || s.top_code) ? `${what} ${s.confidence}%` : what;
}

/** The sensor with the highest level among those that found a problem. */
export function worstProblem(sensors: SensorHealth[]): SensorHealth | null {
  let worst: SensorHealth | null = null;
  for (const s of sensors) {
    if (s.status === "problem" && (!worst || s.level > worst.level)) worst = s;
  }
  return worst;
}

export const fmtRms = (v: number | null | undefined) => num(v, 2);
export const fmtTemp = (v: number | null | undefined) => num(v, 0);
export const fmtBattery = (v: number | null | undefined) => num(v, 0);

export function readingLine(r: LatestReading): string {
  return `Vibration H ${fmtRms(r.rms_h)} · V ${fmtRms(r.rms_v)} · A ${fmtRms(r.rms_a)}`;
}
