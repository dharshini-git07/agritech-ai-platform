import { Product } from "@/types/marketplace";

export class MarketplaceMatchingService {
  /**
   * Finds the best matching organic product in the marketplace catalog using keyword scoring.
   * Prioritizes organicCertified products.
   */
  static findOrganicProduct(
    keywords: string[],
    category?: string,
    products?: Product[]
  ): Product | null {
    if (!products || products.length === 0) return null;

    // Filter to active, approved, in-stock organic products
    let pool = products.filter(
      (p) =>
        p.approvalStatus === "approved" &&
        p.availability !== "out_of_stock" &&
        p.quantity > 0 &&
        p.organicCertified === true
    );

    // If no organic certified products, fallback to any eco-friendly approved/in-stock products
    if (pool.length === 0) {
      pool = products.filter(
        (p) =>
          p.approvalStatus === "approved" &&
          p.availability !== "out_of_stock" &&
          p.quantity > 0
      );
    }

    if (pool.length === 0) return null;

    // Filter by category if specified
    let categoryPool = pool;
    if (category) {
      categoryPool = pool.filter((p) => p.category === category);
      if (categoryPool.length === 0) {
        // Fallback to full pool if specific category has no products
        categoryPool = pool;
      }
    }

    // Score products based on keyword match
    let bestMatch: Product | null = null;
    let highestScore = -1;

    for (const product of categoryPool) {
      let score = 0;
      const productNameLower = product.productName.toLowerCase();
      const descLower = (product.description || "").toLowerCase();
      const subcatLower = (product.subcategory || "").toLowerCase();

      for (const keyword of keywords) {
        const kw = keyword.toLowerCase();
        if (productNameLower.includes(kw)) {
          score += 10; // High score for matching name
          if (productNameLower.startsWith(kw) || productNameLower.includes(" " + kw)) {
            score += 5; // prefix match bonus
          }
        }
        if (subcatLower.includes(kw)) {
          score += 5;
        }
        if (descLower.includes(kw)) {
          score += 2;
        }
      }

      if (score > highestScore && score > 0) {
        highestScore = score;
        bestMatch = product;
      }
    }

    // Fallback: If no keywords matched any product, return the first available product of the category
    if (!bestMatch && categoryPool.length > 0) {
      const exactCategoryMatches = categoryPool.filter((p) => p.category === category);
      if (exactCategoryMatches.length > 0) {
        return exactCategoryMatches[0];
      }
      return categoryPool[0];
    }

    return bestMatch;
  }
}
