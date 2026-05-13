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

export async function fetchTransmissionReport(
  startDate: string,
  endDate: string,
  machineId?: string,
  organizationId?: string
): Promise<DailySensorSummary[]> {
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
    return result.data || [];
  } catch (error) {
    console.error("Error fetching transmission report:", error);
    return [];
  }
}
