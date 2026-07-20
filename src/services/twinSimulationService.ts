import { TwinModel, ScenarioSimulation } from "@/types/digitalTwin";
import { TwinAnalysisEngine } from "./twinAnalysisEngine";

export interface SimulationResult {
  scenarioType: ScenarioSimulation["scenarioType"];
  baseHealthScore: number;
  baseEfficiency: number;
  baseSustainability: number;
  baseProductivity: number;
  
  projectedHealthScore: number;
  projectedEfficiency: number;
  projectedSustainability: number;
  projectedProductivity: number;
  gains: string[];
}

export const TwinSimulationService = {
  /**
   * Simulates changes to a digital twin layout and estimates projected metric improvements
   */
  runSimulation(twin: TwinModel, scenarioType: ScenarioSimulation["scenarioType"]): SimulationResult {
    // 1. Calculate base values
    const zones = twin.zones;
    const baseMetrics = TwinAnalysisEngine.calculateMetrics(zones);
    
    const activeZones = zones.filter((z) => z.status === "active");
    const healthyCount = activeZones.filter((z) => z.healthStatus === "healthy").length;
    const baseHealthRatio = activeZones.length > 0 ? (healthyCount / activeZones.length) : 0.8;
    
    const baseHealthScore = twin.intelligence?.healthScore || Math.round((baseMetrics.sunlightUtilization * 0.4) + (baseHealthRatio * 40) + (baseMetrics.waterEfficiency * 0.2));
    const baseEfficiency = twin.intelligence?.farmingEfficiency || Math.round((baseMetrics.spaceUtilization * 0.4) + (baseMetrics.waterEfficiency * 0.3) + (baseMetrics.sunlightUtilization * 0.3));
    const baseSustainability = twin.intelligence?.sustainability || 75;
    const baseProductivity = baseMetrics.estimatedProductivity;

    // 2. Compute projections based on simulation type
    let projectedHealthScore = baseHealthScore;
    let projectedEfficiency = baseEfficiency;
    let projectedSustainability = baseSustainability;
    let projectedProductivity = baseProductivity;
    let gains: string[] = [];

    switch (scenarioType) {
      case "add_bags":
        projectedHealthScore = Math.min(100, Math.round(baseHealthScore - 2)); // Slightly more maintenance
        projectedEfficiency = Math.min(100, Math.round(baseEfficiency + 10)); // Better space utilization
        projectedSustainability = Math.min(100, Math.round(baseSustainability + 5)); // Mixed crop diversity
        projectedProductivity = Math.min(100, Math.round(baseProductivity + 12)); // Higher volume yield
        gains = [
          "Increases space utilization and density",
          "Yield productivity goes up by projected +12%",
          "Adds more soil crop diversity to the terrace ecosystem"
        ];
        break;

      case "convert_hydro":
        projectedHealthScore = Math.min(100, Math.round(baseHealthScore + 5)); // Hydroponics is automated and cleaner
        projectedEfficiency = Math.min(100, Math.round(baseEfficiency + 12)); // Excellent water efficiency
        projectedSustainability = Math.min(100, Math.round(baseSustainability + 8)); // Low carbon/soil footprint
        projectedProductivity = Math.min(100, Math.round(baseProductivity + 18)); // Hydro crops grow 30-50% faster
        gains = [
          "Water consumption drops by an estimated 20% on the terrace",
          "Accelerates plant growth speeds and increases yield size (+18%)",
          "Reduces physical weeding maintenance load"
        ];
        break;

      case "move_tank":
        projectedHealthScore = Math.min(100, Math.round(baseHealthScore + 3)); // Cleaner layout
        projectedEfficiency = Math.min(100, Math.round(baseEfficiency + 6)); // Optimized flow spacing
        projectedSustainability = Math.min(100, Math.round(baseSustainability + 10)); // Gravity fed fail-safe energy savings
        projectedProductivity = baseProductivity;
        gains = [
          "Enables gravity-fed irrigation flow, reducing electric pump workload",
          "Saves utility electrical energy (+10% efficiency boost)",
          "Increases standard irrigation pipe pressure"
        ];
        break;

      case "change_crops":
        projectedHealthScore = Math.min(100, Math.round(baseHealthScore + 10)); // Optimal matches mean higher health
        projectedEfficiency = Math.min(100, Math.round(baseEfficiency + 8)); // Correct layout
        projectedSustainability = baseSustainability;
        projectedProductivity = Math.min(100, Math.round(baseProductivity + 15)); // Crops match sunlight properly
        gains = [
          "Aligns sunlight matches to near 98% optimal profile",
          "Reduces plant sun-scorch and mold leaf failures",
          "Boosts crop sizing and taste quality parameters (+15%)"
        ];
        break;
    }

    return {
      scenarioType,
      baseHealthScore,
      baseEfficiency,
      baseSustainability,
      baseProductivity,
      projectedHealthScore,
      projectedEfficiency,
      projectedSustainability,
      projectedProductivity,
      gains
    };
  }
};
