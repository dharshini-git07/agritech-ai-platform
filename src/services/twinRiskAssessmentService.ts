import { TwinZone, RiskPredictionItem } from "@/types/digitalTwin";

export const TwinRiskAssessmentService = {
  /**
   * Assesses farming layout risks based on zone parameters, notes, and counts
   */
  assessRisks(zones: TwinZone[]): RiskPredictionItem[] {
    const risks: RiskPredictionItem[] = [];

    const cropZones = zones.filter((z) => ["crop", "hydroponics", "grow_bags"].includes(z.zoneType));
    const tankCount = zones.filter((z) => z.zoneType === "water_tank").length;
    const compostCount = zones.filter((z) => z.zoneType === "compost").length;
    const growBags = zones.filter((z) => z.zoneType === "grow_bags");
    
    const criticalZones = cropZones.filter((z) => z.healthStatus === "critical");
    const attentionZones = cropZones.filter((z) => z.healthStatus === "attention");

    // 1. Disease Risk
    let diseaseLevel: RiskPredictionItem["level"] = "low";
    let diseaseReason = "All crops look healthy. Standard organic pest control is sufficient.";
    if (criticalZones.length > 0) {
      diseaseLevel = "high";
      diseaseReason = `High risk of fungal propagation because ${criticalZones[0].zoneName} is currently reporting a CRITICAL health status.`;
    } else if (attentionZones.length > 0) {
      diseaseLevel = "medium";
      diseaseReason = `Elevated risk of mold due to warning attention statuses reported in ${attentionZones[0].zoneName}.`;
    }
    risks.push({ riskType: "disease", level: diseaseLevel, reason: diseaseReason });

    // 2. Water Stress Risk
    let waterLevel: RiskPredictionItem["level"] = "low";
    let waterReason = "Water reservoirs are well-positioned and match crop requirements.";
    if (cropZones.length > 2 && tankCount === 0) {
      waterLevel = "high";
      waterReason = "High risk. Mapped crop zones require up to 40L of daily irrigation, but no localized Water Tank reservoir was detected.";
    } else {
      const highWaterCrops = cropZones.filter((z) => z.wateringRequirement === "high");
      if (highWaterCrops.length > 0) {
        waterLevel = "medium";
        waterReason = `Medium risk. Sun-loving crop ${highWaterCrops[0].currentCrop || "Tomatoes"} in ${highWaterCrops[0].zoneName} requires frequent watering.`;
      }
    }
    risks.push({ riskType: "water_stress", level: waterLevel, reason: waterReason });

    // 3. Heat Stress Risk
    let heatLevel: RiskPredictionItem["level"] = "low";
    let heatReason = "Temperatures are normal, and shading nets or light levels are within range.";
    const delicateGreens = cropZones.filter((z) => {
      const crop = (z.currentCrop || "").toLowerCase();
      return z.sunlight === "high" && (crop.includes("spinach") || crop.includes("lettuce") || crop.includes("coriander") || crop.includes("mint"));
    });
    
    if (delicateGreens.length > 0) {
      heatLevel = "high";
      heatReason = `High risk. Delicate greens (${delicateGreens[0].currentCrop}) are exposed to direct sunlight (8+ hours) in ${delicateGreens[0].zoneName} without shade net filters.`;
    } else if (cropZones.some((z) => z.sunlight === "high" && !z.notes?.toLowerCase().includes("shade"))) {
      heatLevel = "medium";
      heatReason = "Medium risk. Midday sun exposure is high in uncovered zones; potential soil water drying.";
    }
    risks.push({ riskType: "heat_stress", level: heatLevel, reason: heatReason });

    // 4. Nutrient Deficiency Risk
    let nutrientLevel: RiskPredictionItem["level"] = "low";
    let nutrientReason = "Compost bins are active, and crop rotation schedules are optimal.";
    if (cropZones.length > 0 && compostCount === 0) {
      nutrientLevel = "high";
      nutrientReason = "High risk. Active planting requires constant soil replenishment, but no composting zone is mapped.";
    } else if (cropZones.some((z) => (z.notes || "").toLowerCase().includes("yellow"))) {
      nutrientLevel = "medium";
      nutrientReason = "Medium risk. User observations indicate yellowing leaves, pointing to potential nitrogen deficiency.";
    }
    risks.push({ riskType: "nutrient", level: nutrientLevel, reason: nutrientReason });

    // 5. Overcrowding Risk
    let crowdLevel: RiskPredictionItem["level"] = "low";
    let crowdReason = "All bags and containers have sufficient spacing (1.5+ feet air gaps).";
    const crowdedBags = growBags.filter((z) => (z.area || 0) < 40 && (z.notes || "").toLowerCase().includes("crowd"));
    
    if (crowdedBags.length > 0) {
      crowdLevel = "high";
      crowdReason = `High risk. Multiple grow bags in ${crowdedBags[0].zoneName} are tightly packed, reducing layout ventilation.`;
    } else if (growBags.length > 4 && zones.reduce((sum, z) => sum + (z.area || 0), 0) < 200) {
      crowdLevel = "medium";
      crowdReason = "Medium risk. Total terrace scale is tight; watch layout bag density next to pathways.";
    }
    risks.push({ riskType: "overcrowding", level: crowdLevel, reason: crowdReason });

    return risks;
  }
};
