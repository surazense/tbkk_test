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

/** 0 normal, 1 concern, 2 warning, 3 critical */
export type Level = 0 | 1 | 2 | 3;

export interface Triple {
  threshold_min: number;
  threshold_medium: number;
  threshold_max: number;
}

export interface SensorThresholdRow extends Triple {
  id: string;
  name: string;
  machine: string | null;
  machine_no: string | null;
  area: string | null;
  installed_point: string | null;
  machine_class: string | null;
  is_default: boolean;
  samples: number;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  peak: number | null;
  latest_rms: number | null;
  latest_level: Level | null;
  suggested: Triple | null;
}

export interface PreviewRow {
  sensor_id: string;
  samples: number;
  concern: number;
  warning: number;
  critical: number;
}

export async function getThresholdOverview(days: number) {
  const res = await client().get<{ days: number; sensors: SensorThresholdRow[] }>(
    "/thresholds/sensors",
    { params: { days } }
  );
  return res.data;
}

export async function previewThresholds(
  sensorIds: string[],
  values: Triple,
  days: number
) {
  const res = await client().post<{ days: number; rows: PreviewRow[] }>(
    "/thresholds/preview",
    { sensor_ids: sensorIds, ...values, days }
  );
  return res.data.rows;
}

/**
 * Saves through the existing per-sensor endpoint (PUT /sensors/:id/config), a few
 * at a time, so no bulk endpoint is needed on the backend. Returns how many saved.
 */
export async function updateSensorThresholds(
  sensorIds: string[],
  values: Triple,
  machineClass?: string | null
) {
  const body = {
    ...values,
    ...(machineClass ? { machine_class: machineClass } : {}),
  };
  let saved = 0;
  const CONCURRENCY = 8;
  for (let i = 0; i < sensorIds.length; i += CONCURRENCY) {
    const results = await Promise.allSettled(
      sensorIds
        .slice(i, i + CONCURRENCY)
        .map((id) => client().put(`/sensors/${id}/config`, body))
    );
    saved += results.filter((r) => r.status === "fulfilled").length;
  }
  return saved;
}
