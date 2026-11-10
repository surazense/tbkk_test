import axios from "axios";
import { getToken } from "@/lib/auth";

const client = () =>
  axios.create({
    baseURL: "/api",
    headers: {
      "Content-Type": "application/json",
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
    },
  });

export type MachineStatus = "problem" | "offline" | "ok" | "no_data";

export interface TopFinding {
  code: string;
  label_th: string;
  label_en: string;
  confidence: number;
  evidence: string[];
  recommendation_th: string | null;
  /** what the fault is, from the rule that matched */
  description_th: string | null;
  /** why this pattern points to that fault */
  reasoning_th: string | null;
  sensor_name: string;
}

/** newest raw reading of a sensor (available even when no analysis has run) */
export interface LatestReading {
  at: string;
  rms_h: number | null;
  rms_v: number | null;
  rms_a: number | null;
  temperature: number | null;
  battery: number | null;
  rssi: number | null;
}

/** the limits a sensor's level is decided from */
export interface SensorLimits {
  /** velocity RMS (mm/s) where levels 1, 2 and 3 start */
  vib: [number, number, number];
  /** true when the sensor has no limits of its own and the defaults fill in */
  vib_is_default: boolean;
  /** temperature limits (°C) from the sensor's settings */
  temp_min: number | null;
  temp_max: number | null;
}

export interface SensorHealth {
  /** absent when the server is an older build that does not send limits */
  limits?: SensorLimits;
  reading: LatestReading | null;
  sensor_id: string;
  name: string;
  installed_point: string | null;
  status: MachineStatus;
  level: number;
  top_code: string | null;
  label_th: string | null;
  label_en: string | null;
  confidence: number | null;
  last_reading_at: string | null;
}

export interface MachineEvent {
  id: string;
  sensor_id: string;
  sensor_name: string;
  kind: string;
  code: string | null;
  label_th: string | null;
  level: number | null;
  confidence: number | null;
  created_at: string;
}

export interface MachineHealth {
  key: string;
  machine_id: string | null;
  name: string;
  machine_no: string | null;
  area: string | null;
  status: MachineStatus;
  level: number;
  level_name: string;
  headline: string;
  top_finding: TopFinding | null;
  last_reading_at: string | null;
  sensors: SensorHealth[];
  recent_events: MachineEvent[];
}

export interface MachineHealthResponse {
  generated_at: string;
  machines: MachineHealth[];
}

export async function getMachineHealth() {
  const res = await client().get<MachineHealthResponse>("/machines/health");
  return res.data;
}
