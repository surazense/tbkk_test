"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, Signal, Zap, AlertCircle, TrendingDown, Clock, ActivitySquare } from "lucide-react";
import { Sensor } from "@/lib/types";

interface SummaryCardsProps {
  sensors: Sensor[];
  apiData?: any[];
}

export default function SummaryCards({ sensors, apiData = [] }: SummaryCardsProps) {
  const totalSensors = sensors.length;
  const activeSensors = sensors.filter(s => s.status === "ok" || s.status === "warning").length;
  const criticalSensors = sensors.filter(s => s.status === "critical" || s.status === "concern").length;
  const lostSensors = sensors.filter(s => s.status === "lost").length;
  
  const onlineSensors = sensors.filter(s => s.connectivity === "online").length;

  let totalPackets = 0;
  let totalExpected = 0;
  let totalLostMins = 0;
  let totalAlerts = 0;

  apiData.forEach(d => {
    totalPackets += d.actual_count || 0;
    totalExpected += d.expected_count || 0;
    totalLostMins += d.lost_minutes || 0;
    totalAlerts += d.alert_count || 0;
  });

  const lossPercentage = totalExpected > 0 ? ((totalExpected - totalPackets) / totalExpected) * 100 : 0;
  const formatLostTime = (mins: number) => {
    if (mins < 60) return `${Math.round(mins)}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h`;
  };

  const stats = [
    {
      label: "Total Packets",
      value: totalPackets > 1000000 ? `${(totalPackets / 1000000).toFixed(2)}M` : totalPackets.toLocaleString(),
      change: `of ${totalExpected > 1000000 ? `${(totalExpected / 1000000).toFixed(2)}M` : totalExpected.toLocaleString()} expected`,
      trend: "up",
      icon: Activity,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
      progress: totalExpected > 0 ? (totalPackets / totalExpected) * 100 : 0
    },
    {
      label: "Data Loss",
      value: `${lossPercentage.toFixed(2)}%`,
      change: lossPercentage > 5 ? "Action Required" : "Acceptable",
      trend: lossPercentage > 5 ? "down" : "up",
      icon: TrendingDown,
      color: lossPercentage > 5 ? "text-rose-400" : "text-green-400",
      bg: lossPercentage > 5 ? "bg-rose-500/20" : "bg-green-500/20",
      progress: Math.min(100, lossPercentage)
    },
    {
      label: "Total Lost Time",
      value: formatLostTime(totalLostMins),
      change: "Accumulated downtime",
      trend: "neutral",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/20",
      progress: 50
    },
    {
      label: "Vibration Alerts",
      value: totalAlerts.toString(),
      change: `${criticalSensors} current critical`,
      trend: totalAlerts > 0 ? "down" : "neutral",
      icon: ActivitySquare,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
      progress: 100
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-slate-800 shadow-xl bg-slate-900/50 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">{stat.value}</h3>
                  <span className={`text-[10px] font-semibold ${
                    stat.trend === "up" ? "text-green-500" : stat.trend === "down" ? "text-rose-500" : "text-slate-500"
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
               <div 
                className={`h-full ${stat.color.replace('text-', 'bg-')} opacity-60`} 
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
