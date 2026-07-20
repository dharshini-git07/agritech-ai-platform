import { TwinZone, AIRecommendationItem } from "@/types/digitalTwin";

export const TwinRecommendationEngine = {
  /**
   * Scans zones configurations and emits actionable layout optimization recommendations
   */
  generateRecommendations(zones: TwinZone[]): AIRecommendationItem[] {
    const recommendations: AIRecommendationItem[] = [];
    
    // Helper to push recommendations
    const addRec = (
      title: string,
      description: string,
      reason: string,
      impact: string,
      category: AIRecommendationItem["category"],
      zoneId?: string
    ) => {
      recommendations.push({
        id: `rec_${category}_${recommendations.length + 1}`,
        title,
        description,
        reason,
        impact,
        zoneId,
        category
      });
    };

    zones.forEach((z) => {
      const crop = (z.currentCrop || z.recommendedCrop || "").toLowerCase();
      
      // Rule 1: High sunlight crop in shade/partial sunlight
      if (z.sunlight !== "high" && ["crop", "grow_bags", "hydroponics"].includes(z.zoneType)) {
        if (crop.includes("tomato") || crop.includes("chilli") || crop.includes("pepper") || crop.includes("brinjal")) {
          addRec(
            `Move ${z.currentCrop} from ${z.zoneName}`,
            `Relocate sun-loving plants to a high-sunlight area.`,
            `${z.currentCrop} requires 6–8 hours of direct sunlight. ${z.zoneName} receives only ${z.sunlight === "partial" ? "4-5" : "0-2"} hours. Moving them to a high-sunlight zone will optimize photosynthesis.`,
            `Estimated crop yield increase by +20% and faster fruiting.`,
            "crop",
            z.zoneId
          );
        }
      }

      // Rule-2: Leafy greens in high sunlight without cover
      if (z.sunlight === "high" && ["crop", "grow_bags", "hydroponics"].includes(z.zoneType)) {
        if (crop.includes("lettuce") || crop.includes("spinach") || crop.includes("mint") || crop.includes("coriander")) {
          addRec(
            `Add Shade Netting to ${z.zoneName}`,
            `Install a 50% green shade net cover over delicate leafy greens.`,
            `Delicate crops like ${z.currentCrop} can bolt, scorch, or dry up under direct high sunlight. Shading them reduces thermal stress and retains soil moisture.`,
            `Reduces water evaporation by 25% and bolting risk.`,
            "shade",
            z.zoneId
          );
        }
      }

      // Rule 3: Grow bag layout crowding checks
      if (z.zoneType === "grow_bags" && (z.notes || "").toLowerCase().includes("crowd") === false) {
        addRec(
          `Optimize Spacing in ${z.zoneName}`,
          `Increase the distance between individual grow bags.`,
          `Crowded grow bag layouts restrict air circulation and accelerate pest spread. Standard spacing of 1.5 feet allows sunlight penetration and improves plant health.`,
          `Reduces pest infection risk by 30% and allows easier weeding.`,
          "spacing",
          z.zoneId
        );
      }
    });

    // Rule 4: Compost Bin Adjacency & Ventilation
    const compostZone = zones.find((z) => z.zoneType === "compost");
    if (compostZone) {
      addRec(
        "Optimize Compost Area Location",
        "Place the compost bin in a shaded, well-ventilated perimeter corner.",
        "Compost bins work best in partial shade to maintain moisture balance. Placing them away from main walkways and crop zones prevents odor issues and blocks insect breeding pathways.",
        "Improves terrace hygiene and composting conversion rate.",
        "compost",
        compostZone.zoneId
      );
    }

    // Rule 5: Water Tank Placement and Gravity Irrigation
    const tankZone = zones.find((z) => z.zoneType === "water_tank");
    if (tankZone) {
      addRec(
        "Optimize Water Tank Gravity Feed",
        "Elevate the main water reservoir source.",
        "Positioning the water tank on a raised stand or at the highest layout corner utilizes natural gravity-fed flow. This reduces drip pump electrical power usage and saves pump lifecycle.",
        "Saves electrical pump usage (+10% energy efficiency).",
        "water",
        tankZone.zoneId
      );
    }

    // Default recommendation if list is small
    if (recommendations.length < 3) {
      addRec(
        "Install Rainwater Harvesting Line",
        "Divert terrace rainwater lines directly to the Water Tank reservoir.",
        "Rooftops receive fresh, chlorine-free rainwater. Harvesting it directly into the Main Water Tank increases farming sustainability.",
        "Saves tap water consumption by up to 40% in monsoon months.",
        "other"
      );
    }

    return recommendations;
  }
};
