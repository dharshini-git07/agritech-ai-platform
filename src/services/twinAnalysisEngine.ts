import { TwinZone, EfficiencyMetrics } from "@/types/digitalTwin";

export const TwinAnalysisEngine = {
  /**
   * Evaluates layout and zone coordinates to compute efficiency metrics
   */
  calculateMetrics(zones: TwinZone[]): EfficiencyMetrics {
    const totalGridPoints = 10000; // 100 x 100 grid
    
    // 1. Space Utilization
    const sumArea = zones.reduce((sum, z) => sum + (z.coordinates.w * z.coordinates.h), 0);
    const spaceUtilization = Math.min(100, Math.round((sumArea / totalGridPoints) * 100));

    // 2. Crop Diversity (unique non-"None" crop names)
    const uniqueCrops = new Set<string>();
    zones.forEach((z) => {
      if (z.currentCrop && z.currentCrop !== "None" && z.currentCrop.trim() !== "") {
        uniqueCrops.add(z.currentCrop.trim().toLowerCase());
      }
    });
    const cropDiversity = uniqueCrops.size;

    // 3. Water Efficiency (Estimated percentage)
    // Hydroponics has high water efficiency (uses ~90% less water).
    // Traditional crop zones with high watering requirement lower the efficiency.
    const cropZones = zones.filter((z) => ["crop", "hydroponics", "grow_bags"].includes(z.zoneType));
    const hydroCount = zones.filter((z) => z.zoneType === "hydroponics").length;
    const highWaterCount = cropZones.filter((z) => z.wateringRequirement === "high").length;
    
    let waterEfficiency = 65; // Base efficiency
    if (cropZones.length > 0) {
      const hydroRatio = hydroCount / cropZones.length;
      const highWaterRatio = highWaterCount / cropZones.length;
      waterEfficiency = Math.round(65 + (hydroRatio * 25) - (highWaterRatio * 15));
    }
    waterEfficiency = Math.max(10, Math.min(95, waterEfficiency));

    // 4. Sunlight Utilization (percentage matching crop requirements to sunlight level)
    let sunlightMatches = 0;
    let cropZoneCount = 0;
    cropZones.forEach((z) => {
      cropZoneCount++;
      const crop = (z.currentCrop || z.recommendedCrop || "").toLowerCase();
      
      // Basic matching rules
      if (z.sunlight === "high") {
        if (crop.includes("tomato") || crop.includes("chilli") || crop.includes("pepper") || crop.includes("brinjal") || crop.includes("lettuce") === false) {
          sunlightMatches += 1;
        } else {
          sunlightMatches += 0.5;
        }
      } else if (z.sunlight === "partial") {
        if (crop.includes("spinach") || crop.includes("mint") || crop.includes("herb") || crop.includes("coriander")) {
          sunlightMatches += 1;
        } else {
          sunlightMatches += 0.7;
        }
      } else { // Shade
        if (crop.includes("none") || crop.includes("compost") || crop.includes("tank")) {
          sunlightMatches += 1;
        } else if (crop.includes("spinach") || crop.includes("mint")) {
          sunlightMatches += 0.6;
        } else {
          sunlightMatches += 0.2; // Bad match
        }
      }
    });

    const sunlightUtilization = cropZoneCount > 0 
      ? Math.round((sunlightMatches / cropZoneCount) * 100) 
      : 80;

    // 5. Estimated Productivity (based on space, sunlight utilization, and healthy zones ratio)
    const activeZones = zones.filter((z) => z.status === "active");
    const healthyCount = activeZones.filter((z) => z.healthStatus === "healthy").length;
    const healthRatio = activeZones.length > 0 ? (healthyCount / activeZones.length) : 1;

    const estimatedProductivity = Math.round(
      (spaceUtilization * 0.3) + 
      (sunlightUtilization * 0.4) + 
      (healthRatio * 30)
    );

    return {
      spaceUtilization,
      cropDiversity,
      waterEfficiency,
      sunlightUtilization,
      estimatedProductivity: Math.min(100, Math.max(10, estimatedProductivity))
    };
  },

  /**
   * Evaluates suitability metrics for a specific zone
   */
  evaluateZoneSuitability(zone: TwinZone) {
    const crop = (zone.currentCrop || zone.recommendedCrop || "").toLowerCase();
    
    // 1. Sunlight Suitability
    let sunlightSuitability: "high" | "medium" | "low" = "high";
    if (zone.zoneType === "crop" || zone.zoneType === "grow_bags" || zone.zoneType === "hydroponics") {
      if (zone.sunlight === "shade") {
        if (!crop.includes("mint") && !crop.includes("spinach") && !crop.includes("none")) {
          sunlightSuitability = "low";
        } else {
          sunlightSuitability = "medium";
        }
      } else if (zone.sunlight === "partial") {
        if (crop.includes("tomato") || crop.includes("chilli")) {
          sunlightSuitability = "medium";
        }
      }
    }

    // 2. Crop Suitability
    let cropSuitability: "excellent" | "good" | "poor" = "excellent";
    if (zone.currentCrop && zone.currentCrop !== "None") {
      const rec = zone.recommendedCrop.toLowerCase();
      const curr = zone.currentCrop.toLowerCase();
      if (curr === rec || rec.includes(curr) || curr.includes(rec)) {
        cropSuitability = "excellent";
      } else if (zone.recommendedCrop === "None") {
        cropSuitability = "poor"; // Planting on walkway / utility zones
      } else {
        cropSuitability = "good";
      }
    }

    return {
      sunlightSuitability,
      cropSuitability,
      waterRequirement: zone.wateringRequirement,
      health: zone.healthStatus || "unconfigured",
      maintenance: zone.status === "active" ? "Optimal" : "Pending Setup"
    };
  }
};
