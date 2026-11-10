import type { SensorHealth } from "@/api/machineHealth";

/**
 * Where a sensor sits on a machine picture. A picture ("template") has four bearing slots; a sensor
 * lands in one when its installed_point (or, failing that, its name) reads PART-END, e.g. MOTOR-DE,
 * PUMP-NDE. The picture and its slot map are plain data: changing a sensor's point moves its dot,
 * a new machine type is one more template.
 */

/** the motor's two bearings, and the two of whatever it drives */
export type SlotKey = "MOTOR-NDE" | "MOTOR-DE" | "DRIVEN-DE" | "DRIVEN-NDE";

export interface Template {
  id: "pump" | "blower";
  image: string;
  /** width / height of the image */
  aspect: number;
  drivenName: string;
  /** slot centre, in % of the image width / height */
  slots: Record<SlotKey, { x: number; y: number }>;
}

export const TEMPLATES: Record<Template["id"], Template> = {
  pump: {
    id: "pump",
    image: "/machines/xray-pump.webp",
    aspect: 1672 / 941,
    drivenName: "Pump",
    slots: {
      "MOTOR-NDE": { x: 19.6, y: 50.8 },
      "MOTOR-DE": { x: 37.5, y: 50.8 },
      "DRIVEN-DE": { x: 62.4, y: 50.8 },
      "DRIVEN-NDE": { x: 76.7, y: 50.8 },
    },
  },
  blower: {
    id: "blower",
    image: "/machines/xray-blower.webp",
    aspect: 1672 / 941,
    drivenName: "Blower",
    slots: {
      "MOTOR-NDE": { x: 14.1, y: 50.8 },
      "MOTOR-DE": { x: 41.9, y: 50.8 },
      "DRIVEN-DE": { x: 62.1, y: 50.8 },
      "DRIVEN-NDE": { x: 85.2, y: 50.8 },
    },
  },
};

const DRIVEN = ["PUMP", "BLOWER", "FAN"];
const PARTS = ["MOTOR", ...DRIVEN];

export interface Position {
  component: string;
  end: "DE" | "NDE";
}

/** "MOTOR-DE", "pump2-nde", "D09 BLOWER NDE" -> part and end; anything else -> null */
export function parsePosition(text: string | null | undefined): Position | null {
  if (!text) return null;
  let component: string | undefined;
  let end: "DE" | "NDE" | undefined;
  for (const t of text.toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)) {
    const base = t.replace(/\d+$/, "");
    if (!component && PARTS.includes(base)) component = base;
    else if (!end && (t === "DE" || t === "NDE")) end = t;
  }
  return component && end ? { component, end } : null;
}

export interface PlacedSensor {
  sensor: SensorHealth;
  /** true when the position was read from the sensor's name, not its installed_point */
  guessed: boolean;
}

export interface Layout {
  template: Template;
  slots: Partial<Record<SlotKey, PlacedSensor[]>>;
  unplaced: SensorHealth[];
}

/** Puts the sensors of one machine on a picture. null when none of them has a readable position. */
export function layoutFor(sensors: SensorHealth[]): Layout | null {
  const slots: Layout["slots"] = {};
  const unplaced: SensorHealth[] = [];
  const driven = new Set<string>();

  for (const sensor of sensors) {
    const fromPoint = parsePosition(sensor.installed_point);
    const pos = fromPoint ?? parsePosition(sensor.name);
    if (!pos) {
      unplaced.push(sensor);
      continue;
    }
    if (DRIVEN.includes(pos.component)) driven.add(pos.component);
    const key = `${pos.component === "MOTOR" ? "MOTOR" : "DRIVEN"}-${pos.end}` as SlotKey;
    (slots[key] ??= []).push({ sensor, guessed: !fromPoint });
  }

  if (Object.keys(slots).length === 0) return null;
  const template = driven.has("PUMP") || driven.size === 0 ? TEMPLATES.pump : TEMPLATES.blower;
  return { template, slots, unplaced };
}

/**
 * Where sensors should sit to judge a fault, from the mounting guide (Technical Associates chart,
 * ISO 20816-1, API 670). `groups` are alternatives: the fault is well covered when every slot of
 * one group has a sensor. Faults not listed are judged at any bearing and need nothing special.
 */
export interface FaultNeed {
  groups: SlotKey[][];
  axes: string;
  why: string;
}

export const FAULT_NEEDS: Record<string, FaultNeed> = {
  UNBALANCE: {
    groups: [
      ["MOTOR-NDE", "MOTOR-DE"],
      ["DRIVEN-DE", "DRIVEN-NDE"],
    ],
    axes: "H and V",
    why: "Compare both bearings of the same rotor.",
  },
  MISALIGNMENT: {
    groups: [["MOTOR-DE", "DRIVEN-DE"]],
    axes: "H, V and A",
    why: "Read the two bearings next to the coupling: H and V for parallel offset, A for angular.",
  },
  CAVITATION: {
    groups: [["DRIVEN-DE", "DRIVEN-NDE"]],
    axes: "H, V and A",
    why: "Listen at the pump bearings.",
  },
};

export interface Coverage {
  need: FaultNeed;
  /** the slots that matter for this fault: the best-covered alternative */
  slots: SlotKey[];
  missing: SlotKey[];
}

/** How well the sensors on a picture cover a fault. null when the fault needs nothing special. */
export function coverage(
  code: string | null | undefined,
  slots: Layout["slots"],
  /** the slot of the sensor that found the fault: the alternative holding it is the one to judge */
  found?: SlotKey,
): Coverage | null {
  const need = code ? FAULT_NEEDS[code] : undefined;
  if (!need) return null;
  const filled = (k: SlotKey) => (slots[k]?.length ?? 0) > 0;
  const candidates = need.groups.filter((g) => found && g.includes(found));
  const pool = candidates.length > 0 ? candidates : need.groups;
  let best = pool[0];
  for (const g of pool) {
    if (g.filter(filled).length > best.filter(filled).length) best = g;
  }
  return { need, slots: best, missing: best.filter((k) => !filled(k)) };
}

/** The slot of the sensor with the highest level among those reporting `code`. */
export function slotOfFinding(code: string | null | undefined, slots: Layout["slots"]): SlotKey | undefined {
  if (!code) return undefined;
  let key: SlotKey | undefined;
  let level = -1;
  for (const [k, placed] of Object.entries(slots) as [SlotKey, PlacedSensor[]][]) {
    for (const p of placed) {
      if (p.sensor.status === "problem" && p.sensor.top_code === code && p.sensor.level > level) {
        key = k;
        level = p.sensor.level;
      }
    }
  }
  return key;
}

export function slotLabel(key: SlotKey, template: Template): string {
  const [who, end] = key.split("-");
  return `${who === "MOTOR" ? "Motor" : template.drivenName} · ${end}`;
}
