"use client";

import React, { useState } from "react";
import { FaultScore, FaultIndicator } from "@/lib/types/diagnostic";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopFaultsWidgetProps {
  faults: FaultScore[];
}

export default function TopFaultsWidget({ faults }: TopFaultsWidgetProps) {
  const [expandedFaultId, setExpandedFaultId] = useState<string | null>(null);

  const getSeverityColor = (score: number) => {
    if (score >= 70) return "bg-[#EB2502]"; // Critical (Red)
    if (score >= 40) return "bg-[#FF9900]"; // Warning / Concern (Orange)
    return "bg-[#00E200]"; // Normal / Low (Green)
  };

  const getSeverityTextColor = (score: number) => {
    if (score >= 70) return "text-[#EB2502]";
    if (score >= 40) return "text-[#FF9900]";
    return "text-[#00E200]";
  };

  const sortedFaults = [...faults].sort((a, b) => b.score - a.score);

  const toggleExpand = (id: string) => {
    if (expandedFaultId === id) {
      setExpandedFaultId(null);
    } else {
      setExpandedFaultId(id);
    }
  };

  if (!sortedFaults || sortedFaults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-[#0B1121] border-[1.35px] border-[#374151] rounded-2xl h-full">
        <CheckCircle2 className="h-10 w-10 text-[#00E200] mb-2" />
        <span className="text-gray-300 text-sm">No machine faults detected.</span>
      </div>
    );
  }

  return (
    <div className="bg-[#0B1121] border-[1.35px] border-[#374151] rounded-2xl p-4 flex flex-col gap-4 h-full">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-500" />
          Dominant Faults
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Automated detection of potential mechanical faults.</p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
        {sortedFaults.map((fault) => {
          const isExpanded = expandedFaultId === fault.fault_id;
          const colorClass = getSeverityColor(fault.score);
          const textColorClass = getSeverityTextColor(fault.score);

          return (
            <div
              key={fault.fault_id}
              className={cn(
                "border-[1.35px] border-gray-800 rounded-xl bg-[#161E28] transition-all overflow-hidden cursor-pointer",
                isExpanded ? "border-blue-500/50 shadow-md shadow-blue-500/5" : "hover:border-gray-700"
              )}
              onClick={() => toggleExpand(fault.fault_id)}
            >
              {/* Header Card */}
              <div className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 border border-blue-800/60">
                      {fault.category}
                    </span>
                    <span className={cn("text-xs font-bold uppercase", textColorClass)}>
                      {fault.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white truncate">{fault.fault_name}</h4>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Match Rate</div>
                    <div className={cn("text-base font-extrabold", textColorClass)}>{fault.score}%</div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-3.5 pb-2">
                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all duration-500", colorClass)} style={{ width: `${fault.score}%` }} />
                </div>
              </div>

              {/* Details Drawer */}
              {isExpanded && (
                <div className="border-t border-gray-800/80 bg-[#121921] p-3.5 flex flex-col gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-gray-300 mb-1">Recommended Action (EN):</div>
                    <p className="text-gray-400 leading-relaxed bg-[#161E28] p-2.5 rounded-lg border border-gray-800">{fault.recommendation_en}</p>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-300 mb-1">ข้อแนะนำการแก้ไข (TH):</div>
                    <p className="text-gray-400 leading-relaxed bg-[#161E28] p-2.5 rounded-lg border border-gray-800">{fault.recommendation_th}</p>
                  </div>

                  <div>
                    <div className="font-semibold text-gray-300 mb-2">Rule Evaluation Indicators:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {fault.indicators.map((ind, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-start gap-2 p-2 rounded-lg border",
                            ind.matched
                              ? "bg-green-950/20 border-green-900/50 text-green-300"
                              : "bg-gray-900/35 border-gray-800/60 text-gray-400"
                          )}
                        >
                          {ind.matched ? (
                            <CheckCircle2 className="h-4 w-4 text-[#00E200] shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="font-bold text-xs">{ind.name}</div>
                            <div className="text-[10px] opacity-80">{ind.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
