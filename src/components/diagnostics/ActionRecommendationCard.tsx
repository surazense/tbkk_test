"use client";

import React from "react";
import { FaultScore } from "@/lib/types/diagnostic";
import { Wrench, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionRecommendationCardProps {
  dominantFault: FaultScore | null;
  overallScore: number;
}

export default function ActionRecommendationCard({ dominantFault, overallScore }: ActionRecommendationCardProps) {
  const isHealthy = !dominantFault || dominantFault.score < 40;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 border-[1.35px] flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-all",
        isHealthy
          ? "bg-green-950/10 border-green-800/30 text-green-100"
          : "bg-red-950/10 border-red-800/30 text-red-100"
      )}
    >
      <div className="flex items-start gap-4 flex-1 min-w-0">
        <div
          className={cn(
            "p-3 rounded-xl shrink-0 mt-0.5",
            isHealthy ? "bg-[#00E200]/10 text-[#00E200]" : "bg-[#EB2502]/10 text-[#EB2502]"
          )}
        >
          {isHealthy ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <ShieldAlert className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-bold opacity-80">
              Diagnostic Health Overview
            </span>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-bold",
                isHealthy ? "bg-green-900/40 text-green-300 border border-green-800/40" : "bg-red-900/40 text-red-300 border border-red-800/40"
              )}
            >
              Health Score: {overallScore}%
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">
            {isHealthy ? "Machine operates in a stable condition" : `Action Required: ${dominantFault.fault_name}`}
          </h3>

          <div className="flex flex-col gap-2.5 text-sm text-gray-300">
            {isHealthy ? (
              <p>The diagnostic engine indicates that the machine parameters are within normal limits. Continue routine monitoring.</p>
            ) : (
              <>
                <div className="flex flex-col gap-1.5 leading-relaxed bg-[#161E28]/40 border border-gray-800/30 rounded-xl p-3.5">
                  <div className="text-xs font-semibold text-gray-400">RECOMMENDED ACTION (EN):</div>
                  <p className="text-white font-medium">{dominantFault.recommendation_en}</p>
                </div>
                <div className="flex flex-col gap-1.5 leading-relaxed bg-[#161E28]/40 border border-gray-800/30 rounded-xl p-3.5">
                  <div className="text-xs font-semibold text-gray-400">ข้อเสนอแนะในการดำเนินการ (TH):</div>
                  <p className="text-white font-medium">{dominantFault.recommendation_th}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {!isHealthy && (
        <div className="shrink-0 flex self-stretch md:self-center items-center justify-center pt-2 md:pt-0">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer shadow-md transition-all">
            <Wrench className="h-4 w-4" />
            Create Work Order
          </div>
        </div>
      )}
    </div>
  );
}
