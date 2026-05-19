"use client";

import React from "react";
import { CategoryScore } from "@/lib/types/diagnostic";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryOverviewWidgetProps {
  categories: CategoryScore[];
}

export default function CategoryOverviewWidget({ categories }: CategoryOverviewWidgetProps) {
  // Safe sort of categories by score
  const sortedCategories = [...categories].sort((a, b) => b.score - a.score);

  const getCategoryColor = (score: number) => {
    if (score >= 70) return "bg-[#EB2502]";
    if (score >= 40) return "bg-[#FF9900]";
    if (score > 15) return "bg-blue-500";
    return "bg-gray-600";
  };

  const getCategoryBg = (score: number) => {
    if (score >= 70) return "bg-[#EB2502]/10 border-[#EB2502]/20";
    if (score >= 40) return "bg-[#FF9900]/10 border-[#FF9900]/20";
    if (score > 15) return "bg-blue-500/10 border-blue-500/20";
    return "bg-gray-800/20 border-gray-800/40";
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 70) return "Critical";
    if (score >= 40) return "Warning";
    if (score > 15) return "Mild";
    return "Normal";
  };

  const getSeverityBadgeClass = (score: number) => {
    if (score >= 70) return "text-[#EB2502] bg-[#EB2502]/10 border-[#EB2502]/30";
    if (score >= 40) return "text-[#FF9900] bg-[#FF9900]/10 border-[#FF9900]/30";
    if (score > 15) return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    return "text-gray-400 bg-gray-800/30 border-gray-700/30";
  };

  return (
    <div className="bg-[#0B1121] border-[1.35px] border-[#374151] rounded-2xl p-4 flex flex-col gap-4 h-full">
      <div>
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Health Category Overview
        </h3>
        <p className="text-xs text-gray-400 mt-0.5">Aggregated severity score for each mechanical category.</p>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto max-h-[350px] pr-1 custom-scrollbar">
        {sortedCategories.map((cat) => {
          const barColor = getCategoryColor(cat.score);
          const blockBg = getCategoryBg(cat.score);
          const badgeClass = getSeverityBadgeClass(cat.score);

          return (
            <div
              key={cat.category}
              className={cn(
                "p-3 rounded-xl border-[1.35px] flex flex-col gap-2.5 transition-colors",
                blockBg
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-sm font-extrabold text-white">{cat.category}</span>
                  {cat.dominant_fault && (
                    <span className="text-[10px] text-gray-400 truncate max-w-[200px] mt-0.5">
                      Dominant: {cat.dominant_fault}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider", badgeClass)}>
                    {getSeverityLabel(cat.score)}
                  </span>
                  <span className="text-sm font-extrabold text-white w-8 text-right">{cat.score}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-800/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", barColor)}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
