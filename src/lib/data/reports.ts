import { getToken } from "@/lib/auth";

export interface DailySensorSummary {
  sensor_id: string;
  sensor_name: string | null;
  machine_name: string | null;
  date: string;
  expected_count: number;
  actual_count: number;
  loss_percentage: number;
  lost_minutes: number;
  uptime_percentage: number;
  longest_gap_minutes: number;
  first_seen: string | null;
  last_seen: string | null;
  hourly_counts: number[];
  battery_min: number | null;
  battery_max: number | null;
  battery_avg: number | null;
  temperature_min: number | null;
  temperature_max: number | null;
  temperature_avg: number | null;
  rssi_min: number | null;
  rssi_max: number | null;
  rssi_avg: number | null;
  h_axis_count: number;
  v_axis_count: number;
  a_axis_count: number;
  velo_rms_h_max: number | null;
  velo_rms_v_max: number | null;
  velo_rms_a_max: number | null;
  alert_count: number;
}

export interface TransmissionReportResponse {
  status: "success" | "error";
  data: DailySensorSummary[];
}

// In-memory cache for ultra-fast access within the session
const inMemoryCache: Record<string, DailySensorSummary[]> = {};

export async function fetchTransmissionReport(
  startDate: string,
  endDate: string,
  machineId?: string,
  organizationId?: string
): Promise<DailySensorSummary[]> {
  const cacheKey = `transmission_report_${startDate}_${endDate}_${machineId || ""}_${organizationId || ""}`;

  // 1. Try In-Memory Cache first
  if (inMemoryCache[cacheKey]) {
    // console.log("Serving report from in-memory cache:", cacheKey);
    return inMemoryCache[cacheKey];
  }

  // 2. Try sessionStorage next
  if (typeof window !== "undefined") {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          // Fill in-memory cache for subsequent requests
          inMemoryCache[cacheKey] = parsed;
          // console.log("Serving report from sessionStorage:", cacheKey);
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading from sessionStorage cache:", e);
    }
  }

  // 3. Network Fetch
  const token = getToken();
  let url = `/api/reports/transmissions?start_date=${startDate}&end_date=${endDate}`;
  
  if (machineId) {
    url += `&machine_id=${machineId}`;
  }
  if (organizationId) {
    url += `&organization_id=${organizationId}`;
  }

  try {
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) {
      console.error("Failed to fetch transmission report:", response.statusText);
      return [];
    }

    const result: TransmissionReportResponse = await response.json();
    const data = result.data || [];

    // 4. Save to both caches on success
    if (data.length > 0) {
      inMemoryCache[cacheKey] = data;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.error("Error writing to sessionStorage cache:", e);
        }
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching transmission report:", error);
    return [];
  }
}
