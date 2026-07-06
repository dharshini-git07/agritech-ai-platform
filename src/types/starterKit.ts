export interface StarterKitRecommendation {
  productName: string;
  category: string;
  quantity: number;
  reason: string;
  estimatedPrice: number;
  suitabilityScore: number;
  productId?: string;
  isAvailable: boolean;
}

export interface StarterKit {
  id?: string;
  uid: string;
  terraceAnalysisId: string;
  recommendations: StarterKitRecommendation[];
  estimatedTotalCost: number;
  createdAt?: any;
}
