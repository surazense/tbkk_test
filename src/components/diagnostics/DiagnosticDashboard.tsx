"use client";

import React, { useState, useEffect, useCallback } from "react";
import { diagnosticsApi } from "@/lib/api/diagnostics";
import { DiagnosticResult } from "@/lib/types/diagnostic";
import TopFaultsWidget from "./TopFaultsWidget";
import CategoryOverviewWidget from "./CategoryOverviewWidget";
import ActionRecommendationCard from "./ActionRecommendationCard";
import { Loader2, RefreshCw, CheckCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiagnosticDashboardProps {
  sensorId: string;
  datetime: string;
}

export default function DiagnosticDashboard({ sensorId, datetime }: DiagnosticDashboardProps) {
  const [data, setData] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [calibrating, setCalibrating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await diagnosticsApi.getDiagnosticHistory(sensorId, datetime);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch diagnostics", err);
      setError("Unable to load diagnostic data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [sensorId, datetime]);

  useEffect(() => {
    if (sensorId && datetime) {
      fetchDiagnostics();
    }
  }, [sensorId, datetime, fetchDiagnostics]);

  const handleCalibration = async () => {
    try {
      setCalibrating(true);
      const success = await diagnosticsApi.triggerCalibration(sensorId);
      if (success) {
        // Refresh after calibration
        await fetchDiagnostics();
      }
    } catch (err) {
      console.error("Calibration failed", err);
    } finally {
      setCalibrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0B1121] border-[1.35px] border-[#374151] rounded-2xl min-h-[300px]">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-4" />
        <span className="text-gray-400 text-sm">Evaluating diagnostic rules...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-[#0B1121] border-[1.35px] border-[#374151] rounded-2xl min-h-[300px]">
        <AlertTriangle className="h-8 w-8 text-[#FF9900] mb-4" />
        <span className="text-gray-300 text-sm mb-4">{error || "No diagnostic records found."}</span>
        <Button variant="outline" onClick={fetchDiagnostics} className="bg-transparent border-[#374151] text-white hover:bg-[#374151]/50">
          Retry Evaluation
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Dashboard Subheader Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-[#161E28] border border-gray-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Rule-based Diagnosis Dashboard</h4>
            <p className="text-xs text-gray-400">Diagnosis at {datetime.replace("T", " ").replace("Z", "")}</p>
          </div>
        </div>

        <Button
          onClick={handleCalibration}
          disabled={calibrating}
          className="bg-transparent border-[1.35px] border-[#374151] text-white hover:bg-[#374151]/50 flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${calibrating ? "animate-spin" : ""}`} />
          {calibrating ? "Calibrating..." : "Calibrate Rules"}
        </Button>
      </div>

      {/* Main Alert Banner */}
      <ActionRecommendationCard
        dominantFault={data.dominant_fault}
        overallScore={data.overall_health_score}
      />

      {/* Grid Layout for Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <TopFaultsWidget faults={data.fault_scores} />
        <CategoryOverviewWidget categories={data.category_scores} />
      </div>
    </div>
  );
}
