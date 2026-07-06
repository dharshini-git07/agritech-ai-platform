import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Product } from "@/types/marketplace";
import { RecommendationScore, RecommendationHistory } from "@/types/recommendation";
import { getUserCropAnalyses } from "@/services/analysisService";
import { getUserTerraceAnalyses } from "@/services/terraceService";
import { fetchWeather } from "@/services/weatherService";
import { getCustomerOrders } from "@/services/orderService";
import { getFirestoreCart } from "@/services/cartService";
import { getFirestoreWishlist } from "@/services/wishlistService";

export interface UserPersonalizationContext {
  uid: string;
  city: string;
  preferredLanguage: string;
  budget: number;
  farmingType: "Soil Farming" | "Hydroponics" | "Mixed";
  cropAnalyses: any[];
  terraceAnalyses: any[];
  weather: any;
  orders: any[];
  cartItemIds: string[];
  wishlistIds: string[];
}

export class RecommendationEngineService {
  /**
   * Gathers all user state dependencies in parallel from Firestore and APIs to build a personalization context.
   */
  static async loadPersonalizationContext(uid: string): Promise<UserPersonalizationContext> {
    const userDocRef = doc(db, "users", uid);

    const [
      userSnap,
      cropAnalyses,
      terraceAnalyses,
      weather,
      orders,
      cart,
      wishlist
    ] = await Promise.all([
      getDoc(userDocRef).catch(() => null),
      getUserCropAnalyses(uid).catch(() => []),
      getUserTerraceAnalyses(uid).catch(() => []),
      fetchWeather().catch(() => null),
      getCustomerOrders(uid).catch(() => []),
      getFirestoreCart(uid).catch(() => []),
      getFirestoreWishlist(uid).catch(() => [])
    ]);

    // Parse user profile
    const userData = userSnap?.exists() ? userSnap.data() : null;
    const preferredLanguage = userData?.preferredLanguage || "en";

    // Detect user city/location (e.g. from user profile or last terrace analysis)
    let city = userData?.city || userData?.sellerProfile?.location || "Chennai";
    if (!userData?.city && terraceAnalyses.length > 0) {
      // Find manualDetails city from latest hybrid or manual plan
      const latest = terraceAnalyses[0];
      if (latest.city) city = latest.city;
    }

    // Detect budget
    let budget = 5000;
    if (terraceAnalyses.length > 0) {
      const latest = terraceAnalyses[0];
      const parsed = parseFloat(latest.estimatedCost?.replace(/[^\d.]/g, "") || "0");
      if (parsed > 0) budget = parsed;
    }

    // Detect farming preference
    let farmingType: "Soil Farming" | "Hydroponics" | "Mixed" = "Mixed";
    if (terraceAnalyses.length > 0) {
      const latest = terraceAnalyses[0];
      const summaryLower = (latest.analysisSummary || "").toLowerCase();
      const suitabilityLower = (latest.hydroponicsSuitability || "").toLowerCase();

      if (summaryLower.includes("hydroponic") || suitabilityLower.includes("highly suitable")) {
        farmingType = "Hydroponics";
      } else if (summaryLower.includes("soil") || summaryLower.includes("grow bag")) {
        farmingType = "Soil Farming";
      }
    }

    return {
      uid,
      city,
      preferredLanguage,
      budget,
      farmingType,
      cropAnalyses,
      terraceAnalyses,
      weather,
      orders,
      cartItemIds: cart.map((c: any) => c.productId),
      wishlistIds: wishlist
    };
  }

  /**
   * Evaluates a single marketplace product against the user context and calculates a Suitability Score.
   */
  static calculateSuitabilityScore(
    product: Product,
    context: UserPersonalizationContext
  ): RecommendationScore {
    let score = 50; // Neutral base score
    const explanations: string[] = [];

    const productNameLower = product.productName.toLowerCase();
    const descLower = (product.description || "").toLowerCase();
    const subcatLower = (product.subcategory || "").toLowerCase();

    // 1. Farming Method Alignment
    if (context.farmingType === "Hydroponics") {
      if (product.category === "Hydroponics") {
        score += 20;
        explanations.push("✔ Supports Hydroponics setup.");
      } else if (productNameLower.includes("hydroponic") || descLower.includes("hydroponic")) {
        score += 15;
        explanations.push("✔ Suitable for soil-less farming.");
      } else if (product.category === "Terrace Setup" && subcatLower.includes("grow bag")) {
        score -= 15; // less suitable for pure hydroponics
      }
    } else if (context.farmingType === "Soil Farming") {
      if (product.category === "Terrace Setup" && subcatLower.includes("grow bag")) {
        score += 20;
        explanations.push("✔ Essential container setup for soil cultivation.");
      } else if (product.category === "Organic Farming Inputs") {
        score += 10;
        explanations.push("✔ Replenishes soil microbiology.");
      } else if (product.category === "Hydroponics") {
        score -= 15;
      }
    } else {
      // Mixed
      if (product.category === "Terrace Setup" || product.category === "Hydroponics") {
        score += 10;
        explanations.push("✔ Versatile for mixed farming setups.");
      }
    }

    // 2. Terrace Analysis Context
    if (context.terraceAnalyses.length > 0) {
      const latestTerrace = context.terraceAnalyses[0];

      // Check crop suggestions
      if (latestTerrace.recommendedCrops && latestTerrace.recommendedCrops.length > 0) {
        const matchingCrop = latestTerrace.recommendedCrops.find((crop: string) => {
          const c = crop.toLowerCase();
          return productNameLower.includes(c) || c.includes(productNameLower);
        });
        if (matchingCrop) {
          score += 25;
          explanations.push(`✔ Supports suggested cultivation of ${matchingCrop}.`);
        }
      }

      // Check shopping recommendations
      if (latestTerrace.shoppingRecommendations && latestTerrace.shoppingRecommendations.length > 0) {
        const matchesShopping = latestTerrace.shoppingRecommendations.some((rec: string) => {
          const r = rec.toLowerCase();
          return r.includes(productNameLower) || productNameLower.includes(r) || r.includes(product.category.toLowerCase());
        });
        if (matchesShopping) {
          score += 15;
          explanations.push("✔ Recommended in your Terrace Shopping list.");
        }
      }

      // Sunlight check
      const sunlight = (latestTerrace.sunlight || "").toLowerCase();
      if (sunlight.includes("full") || sunlight.includes("6-8")) {
        if (productNameLower.includes("outdoor") || descLower.includes("full sun")) {
          score += 10;
          explanations.push("✔ Matches your available full sunlight.");
        }
      } else if (sunlight.includes("shade") || sunlight.includes("partial") || sunlight.includes("low")) {
        if (productNameLower.includes("indoor") || descLower.includes("shade") || descLower.includes("indoor")) {
          score += 15;
          explanations.push("✔ Suited for partial shade/indoor areas.");
        }
      }
    }

    // 3. Crop Analysis Context
    if (context.cropAnalyses.length > 0) {
      const latestCrop = context.cropAnalyses[0];
      const disease = (latestCrop.disease || "").toLowerCase();
      const isDiseased = disease !== "no visible disease" && disease !== "none" && disease !== "";

      if (isDiseased) {
        const isFungal =
          disease.includes("fungal") ||
          disease.includes("mildew") ||
          disease.includes("spot") ||
          disease.includes("rot") ||
          disease.includes("rust") ||
          disease.includes("blight");

        const isPest =
          disease.includes("pest") ||
          disease.includes("insect") ||
          disease.includes("aphid") ||
          disease.includes("caterpillar") ||
          disease.includes("mite") ||
          disease.includes("bug") ||
          disease.includes("fly");

        const isDeficient = disease.includes("deficiency") || disease.includes("yellowing");

        if (isFungal && (productNameLower.includes("fungicide") || productNameLower.includes("neem"))) {
          score += 30;
          explanations.push(`✔ Controls diagnosed fungal infection (${latestCrop.disease}).`);
        }
        if (isPest && (productNameLower.includes("neem") || productNameLower.includes("pest"))) {
          score += 30;
          explanations.push(`✔ Natural pest repellent for detected insect attack.`);
        }
        if (
          isDeficient &&
          (product.category === "Organic Farming Inputs" &&
            (productNameLower.includes("fertilizer") || productNameLower.includes("vermicompost")))
        ) {
          score += 30;
          explanations.push(`✔ Restores deficient soil nutrients for crop recovery.`);
        }
      }
    }

    // 4. Weather & Sunlight Context
    if (context.weather) {
      const temp = context.weather.temperature;
      const condition = (context.weather.condition || "").toLowerCase();
      const rainProb = context.weather.rainProbability || 0;

      if (condition.includes("rain") || rainProb > 50) {
        if (productNameLower.includes("fungicide")) {
          score += 10;
          explanations.push("✔ Prevents fungal outbreaks common in humid, wet weather.");
        }
        if (product.category === "Watering & Irrigation" && !productNameLower.includes("sprayer")) {
          score -= 15; // Watering equipment less needed
        }
      } else if (temp > 32 || condition.includes("sunny")) {
        if (product.category === "Watering & Irrigation" || productNameLower.includes("shade")) {
          score += 15;
          explanations.push(`✔ Recommended for dry conditions in ${context.city}.`);
        }
      }
    }

    // 5. Budget Match
    if (product.price <= context.budget / 10) {
      score += 10;
      explanations.push("✔ Fits well within your gardening budget.");
    } else if (product.price > context.budget) {
      score -= 20;
      explanations.push("✖ Exceeds target budget limit.");
    }

    // 6. User Activity Match (Wishlist, Cart, Orders)
    if (context.wishlistIds.includes(product.id!)) {
      score += 15;
      explanations.push("✔ Matches items in your Wishlist.");
    }
    if (context.cartItemIds.includes(product.id!)) {
      score += 10;
      explanations.push("✔ In your current shopping cart.");
    }

    // Check if category matches previously ordered categories
    const orderedCategories = context.orders.map((o: any) => o.category).filter(Boolean);
    if (orderedCategories.includes(product.category)) {
      score += 10;
      explanations.push("✔ Complements your previous purchase history.");
    }

    // 7. Organic Certification
    if (product.organicCertified) {
      score += 10;
      explanations.push("✔ Organic and chemical-free product.");
    }

    // 8. Location Match (shipping distance)
    if (
      product.location &&
      context.city &&
      product.location.toLowerCase().includes(context.city.toLowerCase())
    ) {
      score += 10;
      explanations.push(`✔ Direct local delivery in ${context.city}.`);
    }

    // Clamping
    score = Math.max(15, Math.min(99, score));

    // Determine visual indicator
    let indicator: RecommendationScore["indicator"] = "moderate";
    let indicatorText = "🟠 Moderate Match (50–69%)";

    if (score >= 90) {
      indicator = "excellent";
      indicatorText = "🟢 Excellent Match (90–100%)";
    } else if (score >= 70) {
      indicator = "good";
      indicatorText = "🟡 Good Match (70–89%)";
    } else if (score >= 50) {
      indicator = "moderate";
      indicatorText = "🟠 Moderate Match (50–69%)";
    } else {
      indicator = "low";
      indicatorText = "🔴 Low Match (<50%)";
    }

    // Fallback default explanations if empty
    if (explanations.length === 0) {
      explanations.push("✔ General maintenance product for home gardens.");
    }

    return {
      score,
      indicator,
      indicatorText,
      explanations
    };
  }

  /**
   * Saves a snapshot of recommendation generation history to Firestore.
   */
  static async saveRecommendationHistory(
    uid: string,
    recommendationType: string,
    recommendedProducts: { productId: string; score: number }[],
    analysisReference: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "recommendation_history"), {
      uid,
      recommendationType,
      recommendedProducts,
      generatedAt: serverTimestamp(),
      analysisReference
    });
    return docRef.id;
  }
}
