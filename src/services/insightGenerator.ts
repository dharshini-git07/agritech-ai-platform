import { TwinZone, TwinInsights, EfficiencyMetrics } from "@/types/digitalTwin";

export const InsightGenerator = {
  /**
   * Generates a high-level summary of strengths, weaknesses, immediate actions, and long-term goals
   */
  generateInsights(zones: TwinZone[], metrics: EfficiencyMetrics): TwinInsights {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const immediateActions: string[] = [];
    const longTermImprovements: string[] = [];

    const planningZones = zones.filter((z) => z.status === "planning");
    const cropZones = zones.filter((z) => ["crop", "hydroponics", "grow_bags"].includes(z.zoneType));
    const hydroZones = zones.filter((z) => z.zoneType === "hydroponics");

    // 1. Analyze Strengths
    if (metrics.spaceUtilization > 40) {
      strengths.push(`Good Space Utilization (${metrics.spaceUtilization}%): Most of your terrace footprint is actively utilized.`);
    } else {
      strengths.push("Low footprint clutter: Lots of free space for future grow bag expansions.");
    }

    if (hydroZones.length > 0) {
      strengths.push("Hydroponics system configured: Maximizes water-efficiency and boosts crop growth rate.");
    }
    
    if (metrics.cropDiversity >= 3) {
      strengths.push(`High Crop Diversity (${metrics.cropDiversity} crops): Reduces soil depletion risk and improves ecosystem balance.`);
    }

    const healthyCropCount = cropZones.filter((z) => z.healthStatus === "healthy").length;
    if (cropZones.length > 0 && healthyCropCount / cropZones.length > 0.7) {
      strengths.push("Excellent plant health: Over 70% of crop beds are in a healthy status.");
    }

    // 2. Analyze Weaknesses
    if (planningZones.length > 0) {
      weaknesses.push(`${planningZones.length} zones are currently in planning: Layout potential is not fully active.`);
    }

    const criticalZones = zones.filter((z) => z.healthStatus === "critical");
    if (criticalZones.length > 0) {
      weaknesses.push(`${criticalZones.length} zones are reporting CRITICAL health status requiring diagnostics.`);
    }

    if (metrics.sunlightUtilization < 75) {
      weaknesses.push(`Sub-optimal sunlight matching: Sun-loving or shade-loving crops are mismatched with zone light profiles.`);
    }

    if (strengths.length === 0) strengths.push("Basic virtual twin mapping completed.");
    if (weaknesses.length === 0) weaknesses.push("No immediate configuration flaws found.");

    // 3. Formulate Immediate Actions
    criticalZones.forEach((z) => {
      immediateActions.push(`Inspect diagnostics for ${z.zoneName} and resolve CRITICAL health state.`);
    });

    // Check for mismatched crops in sunlight
    zones.forEach((z) => {
      const crop = (z.currentCrop || "").toLowerCase();
      if (z.sunlight === "shade" && (crop.includes("tomato") || crop.includes("chilli"))) {
        immediateActions.push(`Move sun-loving ${z.currentCrop} out of shaded ${z.zoneName}.`);
      }
      if (z.sunlight === "high" && (crop.includes("lettuce") || crop.includes("spinach"))) {
        immediateActions.push(`Relocate delicate greens in ${z.zoneName} to partial shade or install shade net.`);
      }
    });

    if (immediateActions.length === 0) {
      immediateActions.push("Perform standard weeding and schedule regular compost check-ups.");
      immediateActions.push("Verify that drip emitters are clear of scale deposits.");
    }

    // 4. Formulate Long-Term Improvements
    if (hydroZones.length === 0) {
      longTermImprovements.push("Install a vertical NFT Hydroponics kit to increase space utilization and save water.");
    } else {
      longTermImprovements.push("Expand Hydroponics channels to double leaf crop yield output.");
    }

    if (zones.some(z => z.zoneType === "irrigation" && z.status === "planning")) {
      longTermImprovements.push("Activate automated Drip Irrigation Pump setup connected to moisture sensors.");
    } else {
      longTermImprovements.push("Implement automated solenoid valves for zone-by-zone scheduled irrigation.");
    }
    
    longTermImprovements.push("Configure ESP32 controller links to feed real-time sensor updates to the twin dashboard.");

    // 5. Estimated Impact Summary
    const estimatedImpact = `Implementing immediate actions will increase Sunlight Utilization to ~95%, boosting crop productivity by 15–20% and reducing water wastage by up to 25% through localized shading.`;

    return {
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses.slice(0, 3),
      immediateActions: immediateActions.slice(0, 3),
      longTermImprovements: longTermImprovements.slice(0, 3),
      estimatedImpact
    };
  }
};
