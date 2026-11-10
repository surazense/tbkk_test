"use client";

import { useCallback, useEffect, useState } from "react";
import { getMachineHealth, type MachineHealth } from "@/api/machineHealth";

const REFRESH_MS = 30_000;

/** Loads /machines/health and refreshes it every 30 seconds. Keeps the last data on errors. */
export function useMachineHealth() {
  const [machines, setMachines] = useState<MachineHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMachineHealth();
      setMachines(data.machines);
      setUpdatedAt(data.generated_at);
      setError(null);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { machines, loading, error, updatedAt, reload: load };
}
