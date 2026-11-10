import axios from "axios";
import { getToken } from "@/lib/auth";

export type TrendRange = "24h" | "7d" | "30d";

export interface TrendPoint {
  t: string;
  rms_h: number | null;
  rms_v: number | null;
  rms_a: number | null;
  temperature: number | null;
  battery: number | null;
}

export interface TrendSensor {
  sensor_id: string;
  name: string;
  installed_point: string | null;
  threshold_min: number;
  threshold_medium: number;
  threshold_max: number;
  points: TrendPoint[];
}

export interface TrendEvent {
  id: string;
  sensor_id: string;
  kind: string;
  code: string | null;
  level: number | null;
  created_at: string;
}

export interface MachineTrend {
  range: TrendRange;
  bucket_seconds: number;
  from: string;
  to: string;
  sensors: TrendSensor[];
  events: TrendEvent[];
}

/** History of one machine, already cut down by the server (about 1,500 points for 4 sensors). */
export async function getMachineTrend(key: string, range: TrendRange, signal?: AbortSignal) {
  const res = await axios.get<MachineTrend>(`/api/machines/${encodeURIComponent(key)}/trend`, {
    params: { range },
    signal,
    headers: { ...(getToken() && { Authorization: `Bearer ${getToken()}` }) },
  });
  return res.data;
}
