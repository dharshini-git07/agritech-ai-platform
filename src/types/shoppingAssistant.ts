export interface AssistantRecommendation {
  productName: string;
  category: string;
  quantity: number;
  whyThisProduct: string;
  suitabilityScore: number;
  isAvailable: boolean;
  productId?: string;
  estimatedPrice: number;
}

export interface AssistantShoppingKit {
  title: string;
  recommendations: AssistantRecommendation[];
  estimatedTotalCost: number;
  estimatedMonthlyMaintenanceCost: number;
}

export interface Message {
  role: "user" | "model";
  content: string;
  shoppingKit?: AssistantShoppingKit;
}

export interface ChatSessionDoc {
  id?: string;
  uid: string;
  chatHistory: Message[];
  generatedKits: AssistantShoppingKit[];
  timestamp: any;
  analysisReference: string;
}
