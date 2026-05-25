import { DiagnosticResult, FaultScore, CategoryScore, DiagnosticCategory } from "../types/diagnostic";
import { getToken } from "../auth";

export const diagnosticsApi = {
  getDiagnosticHistory: async (sensorId: string, datetime: string): Promise<DiagnosticResult | null> => {
    try {
      const token = getToken();
      const url = `/api/sensors/${sensorId}/diagnostics`;
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        console.warn(`Failed to fetch diagnostics for sensor ${sensorId}`);
        return null;
      }

      const rawData = await response.json();
      
      // API returns an array, we want the most recent / matching one
      // If we pass datetime to API we might get the exact one. For now, let's use data[0]
      const dataArray = Array.isArray(rawData) ? rawData : (rawData.data || []);
      if (dataArray.length === 0) return null;

      // Find the one matching the datetime, or just use the first one if datetime is not found
      let apiResult = dataArray.find((d: any) => d.datetime === datetime) || dataArray[0];

      // Map API Response to our Frontend UI Format
      const severityMap: Record<string, "NORMAL" | "CONCERN" | "WARNING" | "CRITICAL"> = {
        normal: "NORMAL",
        concern: "CONCERN",
        warning: "WARNING",
        critical: "CRITICAL"
      };

      const mappedSeverity = severityMap[apiResult.severity?.toLowerCase() || "normal"] || "NORMAL";
      
      // Compute overall health score simply: 100 - max(fault_scores)
      let maxScore = 0;
      
      // Try fetching rules to provide richer explanations
      const rules = await diagnosticsApi.getDiagnosticRules().catch(() => null);

      const mappedFaults: FaultScore[] = (apiResult.fault_scores || []).map((fs: any) => {
        if (fs.score > maxScore) maxScore = fs.score;
        
        // Find matching rule to get detailed explanation
        const rule = rules?.find((r) => r.fault_id === fs.fault_id);
        
        let indicators = [
          { 
            name: `Matched Indicators: ${fs.indicators_matched || 0}`, 
            description: "Rule conditions met for this fault.", 
            matched: true, 
            weight: 1.0 
          }
        ];

        if (rule) {
          indicators = [
            {
              name: "Description (รายละเอียด)",
              description: rule.description?.th || rule.description?.en || "No description provided.",
              matched: true,
              weight: 1.0
            },
            {
              name: "Reasoning (การคำนวณและเหตุผล)",
              description: rule.reasoning?.th || rule.reasoning?.en || `Based on ${fs.indicators_matched || 0} matched indicators.`,
              matched: true,
              weight: 1.0
            },
            {
              name: "Possible Causes (สาเหตุที่เป็นไปได้)",
              description: (rule.causes?.th || []).join(", ") || (rule.causes?.en || []).join(", ") || "Unknown",
              matched: true,
              weight: 1.0
            }
          ];
        }

        return {
          fault_id: fs.fault_id,
          fault_name: fs.name || fs.name_th,
          fault_name_th: fs.name_th || fs.name,
          category: fs.category as DiagnosticCategory,
          score: fs.score,
          severity: mappedSeverity, // We apply the overall severity to the dominant fault
          recommendation_th: apiResult.recommendation_th || "",
          recommendation_en: apiResult.recommendation || "",
          indicators: indicators
        };
      });

      const overallHealth = Math.max(0, 100 - maxScore);

      // Extract dominant fault based on highest score
      let dominantFault: FaultScore | null = null;
      if (mappedFaults.length > 0) {
        dominantFault = [...mappedFaults].sort((a, b) => b.score - a.score)[0];
        // Enforce the API's top recommendation onto the dominant fault specifically
        dominantFault.recommendation_th = apiResult.recommendation_th || "";
        dominantFault.recommendation_en = apiResult.recommendation || "";
        dominantFault.severity = mappedSeverity;
      }

      // Group categories
      const categoryMap = new Map<DiagnosticCategory, CategoryScore>();
      mappedFaults.forEach((fs) => {
        const existing = categoryMap.get(fs.category);
        if (!existing || fs.score > existing.score) {
          categoryMap.set(fs.category, {
            category: fs.category,
            score: fs.score,
            dominant_fault: fs.fault_name
          });
        }
      });

      const result: DiagnosticResult = {
        id: apiResult.id || `diag_${Date.now()}`,
        sensor_id: apiResult.sensor_id || sensorId,
        datetime: apiResult.datetime || datetime,
        overall_health_score: overallHealth,
        dominant_fault: dominantFault,
        fault_scores: mappedFaults,
        category_scores: Array.from(categoryMap.values()),
        created_at: new Date().toISOString(),
      };

      return result;

    } catch (error) {
      console.error("Error fetching diagnostics:", error);
      return null;
    }
  },

  getDiagnosticRules: async (): Promise<import("../types/diagnostic").DiagnosticRule[] | null> => {
    try {
      const token = getToken();
      const url = `/api/diagnostics/rules`;
      
      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        console.warn(`Failed to fetch diagnostic rules`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching diagnostic rules:", error);
      return null;
    }
  },

  triggerCalibration: async (sensorId: string): Promise<boolean> => {
    // In real scenario, trigger a POST /api/sensors/${sensorId}/diagnostics/calibrate
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true; 
  }
};
