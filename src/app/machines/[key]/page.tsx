"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import MachineDetail from "@/components/machines/MachineDetail";
import { useMachineHealth } from "@/hooks/useMachineHealth";

export default function MachineDetailPage() {
  const params = useParams<{ key: string }>();
  const key = decodeURIComponent(params.key ?? "");
  const { machines, loading, error } = useMachineHealth();
  const machine = machines.find((m) => m.key === key) ?? null;

  return (
    <div className="space-y-4 bg-[#0B1121] px-2 py-3 sm:px-4 sm:py-4">
      <Link href="/machines" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All machines
      </Link>

      {loading ? (
        <div className="flex items-center gap-2 py-10 text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : machine ? (
        <>
          {error && <div className="text-xs text-red-300">{error} (showing the last data loaded)</div>}
          <MachineDetail m={machine} />
        </>
      ) : (
        <div className="py-10 text-center text-sm text-gray-500">
          {error ?? "Machine not found"}
        </div>
      )}
    </div>
  );
}
