export interface RecommendationScore {
  score: number;
  indicator: "excellent" | "good" | "moderate" | "low";
  indicatorText: string;
  explanations: string[];
}

export interface RecommendationHistory {
  id?: string;
  uid: string;
  recommendationType: string;
  recommendedProducts: { productId: string; score: number }[];
  generatedAt: any;
  analysisReference: string;
}
