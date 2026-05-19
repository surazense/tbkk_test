export type DiagnosticCategory =
  | "Imbalance"
  | "Misalignment"
  | "Looseness"
  | "Bearing"
  | "Resonance"
  | "Electrical"
  | "Other";

export interface FaultIndicator {
  name: string;
  description: string;
  matched: boolean;
  weight: number;
}

export interface FaultScore {
  fault_id: string;
  fault_name: string;
  fault_name_th?: string;
  category: DiagnosticCategory;
  score: number; // 0 to 100
  severity: "NORMAL" | "CONCERN" | "WARNING" | "CRITICAL";
  recommendation_th: string;
  recommendation_en: string;
  indicators: FaultIndicator[];
}

export interface CategoryScore {
  category: DiagnosticCategory;
  score: number; // 0 to 100
  dominant_fault: string | null;
}

export interface DiagnosticResult {
  id: string;
  sensor_id: string;
  datetime: string;
  overall_health_score: number; // 0 to 100 (100 = perfect)
  dominant_fault: FaultScore | null;
  fault_scores: FaultScore[];
  category_scores: CategoryScore[];
  created_at: string;
}

export interface Translation {
  th: string;
  en: string;
}

export interface TranslationList {
  th: string[];
  en: string[];
}

export interface ReferenceItem {
  source: string;
  section: string;
  details: string;
}

export interface DiagnosticRule {
  fault_id: string;
  category: string;
  name: string;
  name_th: string;
  severity_base: string;
  recommendation: Translation;
  description: Translation;
  causes: TranslationList;
  reasoning: Translation;
  how_to_fix: Translation;
  measurement_method: Translation;
  references: ReferenceItem[];
}
