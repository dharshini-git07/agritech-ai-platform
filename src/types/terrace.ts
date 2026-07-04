export interface TerraceAnalysis {
  analysisMode: string;
  terraceArea: string;
  usableArea: string;
  sunlight: string;
  drainage: string;
  layout: string;
  recommendedCrops: string[];
  growBagCount: string;
  hydroponicsSuitability: string;
  waterTankPlacement: string;
  estimatedCost: string;
  shoppingRecommendations: string[];
  maintenanceTips: string[];
  analysisSummary: string;
  confidence: string;
  confidenceReason: string[];
}
