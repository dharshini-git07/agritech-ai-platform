import { Product } from "@/types/marketplace";
import { TerraceAnalysis } from "@/types/terrace";
import { StarterKitRecommendation } from "@/types/starterKit";
import { CropAnalysis } from "@/types/crop";
import { RecoveryKitRecommendation, RecoveryTimelineEntry } from "@/types/recoveryKit";
import { MarketplaceMatchingService } from "@/services/marketplaceMatchingService";

export class RecommendationEngine {
  /**
   * Generates a starter kit recommendation list based on the terrace analysis and current marketplace products.
   */
  static generateStarterKit(
    analysis: TerraceAnalysis,
    marketplaceProducts: Product[],
    manualDetails?: {
      length?: string;
      width?: string;
      floor?: string;
      city?: string;
      budget?: string;
      preference?: string;
    }
  ): { recommendations: StarterKitRecommendation[]; estimatedTotalCost: number } {
    const recommendations: StarterKitRecommendation[] = [];
    const approvedProducts = marketplaceProducts.filter(
      (p) => p.approvalStatus === "approved" && p.availability !== "out_of_stock" && p.quantity > 0
    );

    // 1. Determine Farming Type preference
    // Can be "Soil Farming", "Hydroponics", or "Mixed". Fallback to parsing from analysis values.
    let farmingType = manualDetails?.preference || "Mixed";
    if (!manualDetails?.preference) {
      const summaryLower = (analysis.analysisSummary || "").toLowerCase();
      const suitabilityLower = (analysis.hydroponicsSuitability || "").toLowerCase();
      if (summaryLower.includes("hydroponic") || suitabilityLower.includes("highly suitable")) {
        farmingType = "Hydroponics";
      } else if (summaryLower.includes("soil") || summaryLower.includes("grow bag")) {
        farmingType = "Soil Farming";
      }
    }

    // Parse budget
    const budgetStr = manualDetails?.budget || analysis.estimatedCost || "0";
    const budgetValue = parseFloat(budgetStr.replace(/[^\d.]/g, "")) || 5000;

    // Parse Grow Bag count
    let growBagCount = 10;
    if (analysis.growBagCount) {
      const parsed = parseInt(analysis.growBagCount.replace(/\D/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) {
        growBagCount = parsed;
      }
    }

    // 2. Recommend Crop Seeds/Plants
    if (analysis.recommendedCrops && analysis.recommendedCrops.length > 0) {
      analysis.recommendedCrops.forEach((crop) => {
        // Look for a seed or sapling product in the marketplace matching the crop name
        const matchedProduct = approvedProducts.find((p) => {
          const nameLower = p.productName.toLowerCase();
          const cropLower = crop.toLowerCase();
          return (
            (p.category === "Seeds & Plants" || p.category === "Fresh Produce") &&
            (nameLower.includes(cropLower) || cropLower.includes(nameLower))
          );
        });

        if (matchedProduct) {
          recommendations.push({
            productName: matchedProduct.productName,
            category: matchedProduct.category,
            quantity: 1,
            reason: `Directly matches the AI-recommended crop "${crop}" for your terrace garden layout.`,
            estimatedPrice: matchedProduct.price,
            suitabilityScore: 95,
            productId: matchedProduct.id,
            isAvailable: true,
          });
        } else {
          recommendations.push({
            productName: `${crop} Seeds`,
            category: "Seeds & Plants",
            quantity: 1,
            reason: `Recommended crop "${crop}" for cultivation in your specific sunlight (${analysis.sunlight || "medium"}) and drainage conditions.`,
            estimatedPrice: 49, // Typical mock price for seeds
            suitabilityScore: 90,
            isAvailable: false,
          });
        }
      });
    }

    // 3. Recommend Grow Bags / Pots (if Soil or Mixed farming)
    if (farmingType === "Soil Farming" || farmingType === "Mixed") {
      const matchedGrowBags = approvedProducts.find(
        (p) =>
          p.category === "Terrace Setup" &&
          (p.subcategory === "Grow Bags" || p.productName.toLowerCase().includes("grow bag"))
      );

      const bagQty = Math.min(growBagCount, 15); // cap at 15 for initial kit to manage cost

      if (matchedGrowBags) {
        recommendations.push({
          productName: matchedGrowBags.productName,
          category: matchedGrowBags.category,
          quantity: bagQty,
          reason: `High quality container setup matched to your terrace usable area (${analysis.usableArea}) and grow bag count (${analysis.growBagCount}).`,
          estimatedPrice: matchedGrowBags.price * bagQty,
          suitabilityScore: 92,
          productId: matchedGrowBags.id,
          isAvailable: true,
        });
      } else {
        recommendations.push({
          productName: "Premium Grow Bags (12x12 inches)",
          category: "Terrace Setup",
          quantity: bagQty,
          reason: `Essential containers needed to support your target of ${analysis.growBagCount || "grow bags"} on the terrace.`,
          estimatedPrice: 80 * bagQty,
          suitabilityScore: 90,
          isAvailable: false,
        });
      }

      // Recommend Organic inputs (Compost / Cocopeat)
      const matchedInputs = approvedProducts.find(
        (p) =>
          p.category === "Organic Farming Inputs" &&
          (p.productName.toLowerCase().includes("vermicompost") ||
            p.productName.toLowerCase().includes("cocopeat") ||
            p.productName.toLowerCase().includes("fertilizer"))
      );

      const inputQty = Math.max(2, Math.floor(bagQty / 4));

      if (matchedInputs) {
        recommendations.push({
          productName: matchedInputs.productName,
          category: matchedInputs.category,
          quantity: inputQty,
          reason: `Potting medium nutrients suitable for organic cultivation of your recommended crops.`,
          estimatedPrice: matchedInputs.price * inputQty,
          suitabilityScore: 90,
          productId: matchedInputs.id,
          isAvailable: true,
        });
      } else {
        recommendations.push({
          productName: "Organic Vermicompost (5kg)",
          category: "Organic Farming Inputs",
          quantity: 2,
          reason: `Essential soil conditioner and rich organic nutrient mix for terrace grow bags.`,
          estimatedPrice: 250,
          suitabilityScore: 88,
          isAvailable: false,
        });
      }
    }

    // 4. Recommend Hydroponics setup (if Hydroponics or Mixed farming)
    if (farmingType === "Hydroponics" || farmingType === "Mixed") {
      const matchedHydro = approvedProducts.find(
        (p) =>
          p.category === "Hydroponics" &&
          (p.productName.toLowerCase().includes("kit") ||
            p.productName.toLowerCase().includes("nft") ||
            p.productName.toLowerCase().includes("system"))
      );

      if (matchedHydro) {
        recommendations.push({
          productName: matchedHydro.productName,
          category: matchedHydro.category,
          quantity: 1,
          reason: `Starter hydroponics system matched to your layout. Suitability: ${analysis.hydroponicsSuitability}`,
          estimatedPrice: matchedHydro.price,
          suitabilityScore: 89,
          productId: matchedHydro.id,
          isAvailable: true,
        });
      } else {
        recommendations.push({
          productName: "Home Hydroponics NFT Starter Kit (24 Holes)",
          category: "Hydroponics",
          quantity: 1,
          reason: `Compact vertical space-saver kit designed for residential balconies and terraces with layout constraints.`,
          estimatedPrice: 3500,
          suitabilityScore: 85,
          isAvailable: false,
        });
      }
    }

    // 5. Recommend Irrigation Setup (Watering & Irrigation)
    const matchedIrrigation = approvedProducts.find(
      (p) =>
        p.category === "Watering & Irrigation" &&
        (p.productName.toLowerCase().includes("drip") ||
          p.productName.toLowerCase().includes("can") ||
          p.productName.toLowerCase().includes("sprayer"))
    );

    if (matchedIrrigation) {
      recommendations.push({
        productName: matchedIrrigation.productName,
        category: matchedIrrigation.category,
        quantity: 1,
        reason: `Hydration setup matched to your sunlight conditions (${analysis.sunlight || "medium"}) to prevent plant drying.`,
        estimatedPrice: matchedIrrigation.price,
        suitabilityScore: 91,
        productId: matchedIrrigation.id,
        isAvailable: true,
      });
    } else {
      recommendations.push({
        productName: "Drip Irrigation Starter Kit (10 Taps)",
        category: "Watering & Irrigation",
        quantity: 1,
        reason: `Efficient irrigation to supply water uniformly and automatically without overloading structural weights.`,
        estimatedPrice: 799,
        suitabilityScore: 88,
        isAvailable: false,
      });
    }

    // 6. Recommend Garden Tools (Garden Tools)
    const matchedTools = approvedProducts.find(
      (p) =>
        p.category === "Garden Tools" &&
        (p.productName.toLowerCase().includes("trowel") ||
          p.productName.toLowerCase().includes("set") ||
          p.productName.toLowerCase().includes("pruner"))
    );

    if (matchedTools) {
      recommendations.push({
        productName: matchedTools.productName,
        category: matchedTools.category,
        quantity: 1,
        reason: `Basic maintenance tools required to prune and harvest crops.`,
        estimatedPrice: matchedTools.price,
        suitabilityScore: 85,
        productId: matchedTools.id,
        isAvailable: true,
      });
    } else {
      recommendations.push({
        productName: "Garden Hand Tools Set (Trowel, Fork, Weeders)",
        category: "Garden Tools",
        quantity: 1,
        reason: `Essential maintenance tools for setting up and caring for the plants.`,
        estimatedPrice: 350,
        suitabilityScore: 80,
        isAvailable: false,
      });
    }

    // Calculate Estimated Total Cost of available items
    const estimatedTotalCost = recommendations
      .filter((r) => r.isAvailable)
      .reduce((sum, r) => sum + r.estimatedPrice, 0);

    return {
      recommendations,
      estimatedTotalCost,
    };
  }

  /**
   * Generates an organic recovery kit and step-by-step schedule based on a crop's disease analysis.
   */
  static generateRecoveryKit(
    analysis: CropAnalysis,
    marketplaceProducts: Product[]
  ): {
    recommendations: RecoveryKitRecommendation[];
    timeline: RecoveryTimelineEntry[];
    estimatedTotalCost: number;
  } {
    const recommendations: RecoveryKitRecommendation[] = [];
    const timeline: RecoveryTimelineEntry[] = [];

    const disease = (analysis.disease || "").toLowerCase();
    const severity = (analysis.severity || "").toLowerCase();
    const treatmentText = (analysis.treatment || []).join(" ").toLowerCase();

    const isHealthy =
      disease === "no visible disease" ||
      disease === "none" ||
      disease === "" ||
      disease.includes("healthy");

    if (isHealthy) {
      // General preventive health booster kit
      const neemOilMatch = MarketplaceMatchingService.findOrganicProduct(
        ["neem", "oil"],
        "Organic Farming Inputs",
        marketplaceProducts
      );

      recommendations.push({
        productName: neemOilMatch ? neemOilMatch.productName : "Neem Oil Pest Preventive",
        category: "Organic Farming Inputs",
        organicCertified: true,
        quantity: 1,
        estimatedPrice: neemOilMatch ? neemOilMatch.price : 180,
        suitabilityScore: 95,
        isAvailable: !!neemOilMatch,
        productId: neemOilMatch?.id,
        whyThisProduct: "Neem Oil serves as an excellent organic preventive shield to keep pests and insects away.",
      });

      const vermiMatch = MarketplaceMatchingService.findOrganicProduct(
        ["vermicompost", "compost"],
        "Organic Farming Inputs",
        marketplaceProducts
      );

      recommendations.push({
        productName: vermiMatch ? vermiMatch.productName : "Organic Vermicompost",
        category: "Organic Farming Inputs",
        organicCertified: true,
        quantity: 1,
        estimatedPrice: vermiMatch ? vermiMatch.price : 120,
        suitabilityScore: 92,
        isAvailable: !!vermiMatch,
        productId: vermiMatch?.id,
        whyThisProduct: "Adding organic vermicompost boosts overall soil fertility and maintains robust plant immune defenses.",
      });

      // Timeline for preventive care
      timeline.push({
        day: "Day 1",
        title: "Soil Nourishment",
        actions: ["Add a handful of Vermicompost around the base of the crop to boost plant nutrition.", "Water the soil gently."],
      });
      timeline.push({
        day: "Day 3",
        title: "Prophylactic Spray",
        actions: ["Dilute Neem Oil in water and apply a light mist onto the leaves to repel pests.", "Check leaf undersides for early pest signs."],
      });
      timeline.push({
        day: "Day 7",
        title: "Health Audit",
        actions: ["Inspect crop health and growth. Check for clean, vibrant green leaf development."],
      });
    } else {
      // Plant is diseased / deficient. Determine what products are required.
      const requiresFungicide =
        disease.includes("fungal") ||
        disease.includes("mildew") ||
        disease.includes("spot") ||
        disease.includes("rot") ||
        disease.includes("rust") ||
        disease.includes("blight") ||
        treatmentText.includes("fungicide") ||
        treatmentText.includes("fungal");

      const requiresPestControl =
        disease.includes("pest") ||
        disease.includes("insect") ||
        disease.includes("aphid") ||
        disease.includes("caterpillar") ||
        disease.includes("mite") ||
        disease.includes("bug") ||
        disease.includes("fly") ||
        disease.includes("thrip") ||
        treatmentText.includes("insecticide") ||
        treatmentText.includes("spray") ||
        treatmentText.includes("neem");

      const requiresNutrient =
        disease.includes("deficiency") ||
        disease.includes("chlorosis") ||
        disease.includes("yellowing") ||
        disease.includes("nitrogen") ||
        disease.includes("phosphorus") ||
        disease.includes("potassium") ||
        disease.includes("nutrient") ||
        treatmentText.includes("fertilizer") ||
        treatmentText.includes("compost") ||
        treatmentText.includes("manure");

      // 1. Organic Pest Control / Neem Oil
      if (requiresPestControl || requiresFungicide) {
        const neemMatch = MarketplaceMatchingService.findOrganicProduct(
          ["neem", "oil"],
          "Organic Farming Inputs",
          marketplaceProducts
        );

        recommendations.push({
          productName: neemMatch ? neemMatch.productName : "Organic Neem Oil (Concentrate)",
          category: "Organic Farming Inputs",
          organicCertified: true,
          quantity: 1,
          estimatedPrice: neemMatch ? neemMatch.price : 199,
          suitabilityScore: 96,
          isAvailable: !!neemMatch,
          productId: neemMatch?.id,
          whyThisProduct: "Neem Oil controls soft-bodied insects, scales, and mites naturally without leaving chemical residues.",
        });
      }

      // 2. Organic Fungicide (if fungal)
      if (requiresFungicide) {
        const fungicideMatch = MarketplaceMatchingService.findOrganicProduct(
          ["fungicide", "biopest", "trichoderma", "pseudomonas"],
          "Organic Farming Inputs",
          marketplaceProducts
        );

        recommendations.push({
          productName: fungicideMatch ? fungicideMatch.productName : "Bio Fungicide (Trichoderma)",
          category: "Organic Farming Inputs",
          organicCertified: true,
          quantity: 1,
          estimatedPrice: fungicideMatch ? fungicideMatch.price : 150,
          suitabilityScore: 94,
          isAvailable: !!fungicideMatch,
          productId: fungicideMatch?.id,
          whyThisProduct: "Bio Fungicide naturally combats fungal pathogens like root rots, leaf spots, and mildews in the soil and foliage.",
        });
      }

      // 3. Bio Fertilizer / Vermicompost
      if (requiresNutrient || requiresFungicide || requiresPestControl) {
        const vermiMatch = MarketplaceMatchingService.findOrganicProduct(
          ["vermicompost", "cocopeat", "compost"],
          "Organic Farming Inputs",
          marketplaceProducts
        );

        recommendations.push({
          productName: vermiMatch ? vermiMatch.productName : "Premium Vermicompost",
          category: "Organic Farming Inputs",
          organicCertified: true,
          quantity: 2,
          estimatedPrice: vermiMatch ? vermiMatch.price * 2 : 240,
          suitabilityScore: 90,
          isAvailable: !!vermiMatch,
          productId: vermiMatch?.id,
          whyThisProduct: "Vermicompost improves soil structure, aeration, and replenishes micro/macro nutrients critical for post-disease recovery.",
        });
      }

      // 4. Sprayer or Garden Tools
      if (
        treatmentText.includes("spray") ||
        treatmentText.includes("cut") ||
        treatmentText.includes("remove")
      ) {
        const sprayerMatch = MarketplaceMatchingService.findOrganicProduct(
          ["sprayer", "watering", "can"],
          "Watering & Irrigation",
          marketplaceProducts
        );

        if (sprayerMatch) {
          recommendations.push({
            productName: sprayerMatch.productName,
            category: sprayerMatch.category,
            organicCertified: sprayerMatch.organicCertified,
            quantity: 1,
            estimatedPrice: sprayerMatch.price,
            suitabilityScore: 85,
            isAvailable: true,
            productId: sprayerMatch.id,
            whyThisProduct: "Use a dedicated spray bottle to apply diluted Neem Oil or Bio Fungicide evenly across all foliage.",
          });
        }
      }

      // Timeline creation
      if (requiresFungicide) {
        timeline.push({
          day: "Day 1",
          title: "Pruning & Foliar Treatment",
          actions: [
            "Carefully prune infected or spotted leaves using clean scissors. Dispose of them away from other plants.",
            "Mix 5ml of Neem Oil or Bio Fungicide in 1L of water. Spray thoroughly on the leaves during evening hours.",
          ],
        });
        timeline.push({
          day: "Day 3",
          title: "Soil Inoculation",
          actions: [
            "Apply Vermicompost around the base of the crop.",
            "Water gently with Bio Fungicide mix to protect the roots from fungal wilt or root rot.",
          ],
        });
        timeline.push({
          day: "Day 7",
          title: "Follow-up Spray & Review",
          actions: [
            "Apply a second spray of Neem Oil if pests or mold signs persist.",
            "Verify that new leaves sprouting do not display spots, wilting, or powdery coatings.",
          ],
        });
      } else if (requiresPestControl) {
        timeline.push({
          day: "Day 1",
          title: "Pest Eradication",
          actions: [
            "Wipe off clusters of insects (like aphids or scales) manually using a damp cloth.",
            "Spray diluted Neem Oil over the entire plant, paying special attention to the undersides of the leaves.",
          ],
        });
        timeline.push({
          day: "Day 3",
          title: "Soil Enrichment",
          actions: [
            "Incorporate Vermicompost into the topsoil to strengthen plant immunity.",
            "Ensure the container has good drainage to prevent attracting root pests.",
          ],
        });
        timeline.push({
          day: "Day 7",
          title: "Inspection",
          actions: [
            "Check leaf joints and undersides for pests.",
            "Re-apply Neem Oil if minor insect presence is still detected.",
          ],
        });
      } else {
        // Nutrient Deficiencies
        timeline.push({
          day: "Day 1",
          title: "Soil Feeding",
          actions: [
            "Loosen topsoil gently and mix in 2-3 cups of Vermicompost.",
            "Water the plant immediately to activate nutrient release.",
          ],
        });
        timeline.push({
          day: "Day 3",
          title: "Foliar Nutrition boost",
          actions: [
            "Spray leaves with diluted liquid organic fertilizer (if available) to ensure direct nutrient absorption.",
          ],
        });
        timeline.push({
          day: "Day 7",
          title: "Color Audit",
          actions: [
            "Inspect new leaves. Yellowing or chlorosis should stop spreading, and new shoots should appear deep green.",
          ],
        });
      }
    }

    const estimatedTotalCost = recommendations
      .filter((r) => r.isAvailable)
      .reduce((sum, r) => sum + r.estimatedPrice, 0);

    return {
      recommendations,
      timeline,
      estimatedTotalCost,
    };
  }
}
