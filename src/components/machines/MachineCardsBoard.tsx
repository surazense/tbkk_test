"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, RefreshCw, Search } from "lucide-react";
import SensorStatusSummary, {
  type SensorStatusType,
} from "@/components/Dashboard/SensorStatusSummary";
import type { MachineHealth } from "@/api/machineHealth";
import { useMachineHealth } from "@/hooks/useMachineHealth";
import MachineCard from "./MachineCard";
import { LEVEL_COLOR, ago, summaryCounts, summaryKey } from "./machineUi";

const NO_AREA = "No area";

/** dot colours of the status strip, in the order they are shown on a section header */
const DOT: [SensorStatusType, string, string][] = [
  ["critical", LEVEL_COLOR[3], "Critical"],
  ["concern", LEVEL_COLOR[2], "Concern"],
  ["warning", LEVEL_COLOR[1], "Warning"],
  ["normal", LEVEL_COLOR[0], "Normal"],
  ["lost", "#404040", "Lost"],
];

const areaOf = (m: MachineHealth) => m.area?.trim() || NO_AREA;

function Grid({ machines }: { machines: MachineHealth[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 sm:gap-4">
      {machines.map((m) => (
        <MachineCard key={m.key} m={m} />
      ))}
    </div>
  );
}

export default function MachineCardsBoard() {
  const { machines, loading, error, updatedAt, reload } = useMachineHealth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SensorStatusType[]>([]);
  const [area, setArea] = useState("");
  const [grouped, setGrouped] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const counts = useMemo(() => summaryCounts(machines), [machines]);

  /** every area with how many machines it holds, most urgent area first (the API sorts machines) */
  const areas = useMemo(() => {
    const seen = new Map<string, number>();
    machines.forEach((m) => seen.set(areaOf(m), (seen.get(areaOf(m)) ?? 0) + 1));
    return Array.from(seen.entries());
  }, [machines]);

  const list = useMemo(
    () =>
      machines
        .filter((m) => area === "" || areaOf(m) === area)
        .filter((m) => selected.length === 0 || selected.includes(summaryKey(m)))
        .filter((m) =>
          `${m.name} ${m.machine_no ?? ""} ${m.area ?? ""}`.toLowerCase().includes(search.toLowerCase())
        ),
    [machines, area, selected, search]
  );

  const sections = useMemo(() => {
    const map = new Map<string, MachineHealth[]>();
    list.forEach((m) => {
      const k = areaOf(m);
      map.set(k, [...(map.get(k) ?? []), m]);
    });
    return Array.from(map.entries());
  }, [list]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-10 text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error} (showing the last data loaded)
        </div>
      )}

      <SensorStatusSummary
        noun="Machine"
        hideStandby
        data={{
          total: machines.length,
          lastUpdate: updatedAt ?? new Date().toISOString(),
          status: counts,
        }}
        selectedStatuses={selected}
        onStatusFilterChange={setSelected}
        onSelectAll={() => setSelected([])}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search machine / code / area"
            className="w-64 rounded border border-[#374151] bg-[#161E28] py-1.5 pl-8 pr-2 text-sm text-white"
          />
        </div>

        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded border border-[#374151] bg-[#161E28] px-2 py-1.5 text-sm text-white"
          title="Filter by area"
        >
          <option value="">All areas ({machines.length})</option>
          {areas.map(([name, n]) => (
            <option key={name} value={name}>
              {name} ({n})
            </option>
          ))}
        </select>

        <div className="inline-flex overflow-hidden rounded border border-[#374151] text-sm">
          <button
            onClick={() => setGrouped(true)}
            className={`px-3 py-1.5 ${grouped ? "bg-blue-600 text-white" : "bg-[#161E28] text-gray-300"}`}
          >
            By area
          </button>
          <button
            onClick={() => setGrouped(false)}
            className={`px-3 py-1.5 ${!grouped ? "bg-blue-600 text-white" : "bg-[#161E28] text-gray-300"}`}
          >
            All together
          </button>
        </div>

        <button
          onClick={reload}
          className="ml-auto inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white"
          title="Refresh"
        >
          <RefreshCw className="h-3.5 w-3.5" /> {updatedAt ? `Updated ${ago(updatedAt)}` : "Refresh"}
        </button>
      </div>

      {machines.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">No machines found in this organization</div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-gray-500">No machines match the filter</div>
      ) : !grouped ? (
        <Grid machines={list} />
      ) : (
        <div className="space-y-5">
          {sections.map(([name, items]) => {
            const isClosed = !!collapsed[name];
            const c = summaryCounts(items);
            return (
              <section key={name}>
                <button
                  onClick={() => setCollapsed((s) => ({ ...s, [name]: !s[name] }))}
                  className="mb-3 flex w-full flex-wrap items-center gap-3 rounded-lg border border-[#374151] bg-[#030616] px-3 py-2 text-left"
                >
                  {isClosed ? (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-lg font-bold text-white">{name}</span>
                  <span className="text-sm text-gray-400">{items.length} {items.length === 1 ? "machine" : "machines"}</span>
                  <span className="ml-auto flex flex-wrap items-center gap-3">
                    {DOT.filter(([k]) => c[k] > 0).map(([k, color, label]) => (
                      <span key={k} className="inline-flex items-center gap-1 text-sm text-gray-200" title={label}>
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                        {label} {c[k]}
                      </span>
                    ))}
                  </span>
                </button>
                {!isClosed && <Grid machines={items} />}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
