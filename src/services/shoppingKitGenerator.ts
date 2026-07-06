import { Product } from "@/types/marketplace";
import { AssistantShoppingKit, AssistantRecommendation } from "@/types/shoppingAssistant";
import { MarketplaceMatchingService } from "@/services/marketplaceMatchingService";

export class ShoppingKitGenerator {
  /**
   * Translates abstract AI recommendations into resolved shopping assistant kit items matching live marketplace products.
   */
  static generateKit(
    conceptualKit: {
      title: string;
      items: {
        productName: string;
        category: string;
        quantity: number;
        whyThisProduct: string;
        suitabilityScore: number;
      }[];
    },
    marketplaceProducts: Product[]
  ): AssistantShoppingKit {
    const recommendations: AssistantRecommendation[] = [];

    for (const item of conceptualKit.items) {
      // Build search keywords from name
      const keywords = item.productName.split(/\s+/).filter((w) => w.length > 2);
      if (keywords.length === 0) keywords.push(item.productName);

      // Match against live products
      const matchedProd = MarketplaceMatchingService.findOrganicProduct(
        keywords,
        item.category,
        marketplaceProducts
      );

      if (matchedProd) {
        recommendations.push({
          productName: matchedProd.productName,
          category: matchedProd.category,
          quantity: item.quantity,
          whyThisProduct: item.whyThisProduct,
          suitabilityScore: item.suitabilityScore || 90,
          isAvailable: true,
          productId: matchedProd.id,
          estimatedPrice: matchedProd.price * item.quantity,
        });
      } else {
        recommendations.push({
          productName: item.productName,
          category: item.category,
          quantity: item.quantity,
          whyThisProduct: item.whyThisProduct,
          suitabilityScore: item.suitabilityScore || 80,
          isAvailable: false,
          estimatedPrice: 0,
        });
      }
    }

    const estimatedTotalCost = recommendations
      .filter((r) => r.isAvailable)
      .reduce((sum, r) => sum + r.estimatedPrice, 0);

    // Calculate a mock monthly maintenance cost (typically 10% of setup cost, or standard maintenance compost/pest sprays = ~₹250)
    const estimatedMonthlyMaintenanceCost = Math.max(150, Math.round(estimatedTotalCost * 0.08));

    return {
      title: conceptualKit.title || "Custom AI Garden Package",
      recommendations,
      estimatedTotalCost,
      estimatedMonthlyMaintenanceCost,
    };
  }
}
