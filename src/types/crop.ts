export interface CropAnalysis {
  crop: string;
  health: string;
  disease: string;
  severity: string;
  cause: string;
  whyOccurs: string;
  symptoms: string[];
  treatment: string[];
  prevention: string[];
  water: string;
  fertilizer: string;
  recoveryTime: string;
  recommendation: string;
  confidence: string;
  confidenceReason: string[];
  analysisSummary: string;
  imageQuality: string;
  analysisLimitations: string;
}
