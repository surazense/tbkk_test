import { formatToThailandTime } from "@/lib/utils";
import { formatDateTimeDayFirst } from "@/lib/utils/sensor-charts";

/**
 * One stored sensor reading in the history list.
 *
 * `datetime` is a time bucket (it depends on the sensor's time interval) and is
 * NOT unique: a sensor can send several readings inside one bucket.
 * `created_at` is the time the reading was received, so it identifies a single
 * reading. Older rows may not have it, then we fall back to `datetime`.
 */
export interface SensorRecordRef {
  datetime: string;
  created_at?: string | null;
}

/** How to ask the backend for one reading (`created_at` wins over `datetime`). */
export type SensorRecordSelector = string | SensorRecordRef;

export function getRecordKey(item: SensorRecordRef): string {
  return item.created_at || item.datetime;
}

/** Row label. created_at is a real instant, shown in Thailand time with seconds. */
export function formatRecordLabel(item: SensorRecordRef): string {
  if (item.created_at) {
    const date = new Date(item.created_at);
    if (!isNaN(date.getTime())) {
      return formatToThailandTime(date).replace(",", "");
    }
  }
  return formatDateTimeDayFirst(item.datetime);
}

/** Thailand calendar date (YYYY-MM-DD) of a reading's created_at, or null. */
export function getRecordThaiDate(item: SensorRecordRef): string | null {
  if (!item.created_at) return null;
  const date = new Date(item.created_at);
  if (isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Query string that selects one reading on GET /sensors/:id/last-data. */
export function buildRecordQuery(selector: SensorRecordSelector): string {
  if (typeof selector === "string") {
    return `datetime=${encodeURIComponent(selector)}`;
  }
  if (selector.created_at) {
    return `created_at=${encodeURIComponent(selector.created_at)}`;
  }
  return `datetime=${encodeURIComponent(selector.datetime)}`;
}
