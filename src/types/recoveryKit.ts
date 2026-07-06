export interface RecoveryKitRecommendation {
  productName: string;
  category: string;
  organicCertified: boolean;
  quantity: number;
  estimatedPrice: number;
  suitabilityScore: number;
  isAvailable: boolean;
  productId?: string;
  whyThisProduct: string;
}

export interface RecoveryTimelineEntry {
  day: string;
  title: string;
  actions: string[];
}

export interface RecoveryKit {
  id?: string;
  uid: string;
  cropAnalysisId: string;
  recommendations: RecoveryKitRecommendation[];
  timeline: RecoveryTimelineEntry[];
  estimatedTotalCost: number;
  createdAt?: any;
}
