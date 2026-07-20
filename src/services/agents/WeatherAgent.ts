import { TwinModel } from "@/types/digitalTwin";

export const WeatherAgent = {
  name: "WeatherAgent",
  responsibility: "Climate trends, heat indexing, wind speeds and seasonal warnings",

  /**
   * Generates weather warnings and optimization recommendations
   */
  async execute(twin: TwinModel, goal: string) {
    const goalLower = goal.toLowerCase();
    
    let seasonalWarnings = ["Expect dry winds over the next 10 days; soil may dry out faster."];
    let optimalShadingNeeded = false;

    if (goalLower.includes("summer") || goalLower.includes("heat")) {
      seasonalWarnings = [
        "Dry summer spell alert: temperatures may reach 38°C.",
        "UV index is high; potential leaf sunburn for tender seedlings."
      ];
      optimalShadingNeeded = true;
    } else if (goalLower.includes("water") || goalLower.includes("rain")) {
      seasonalWarnings = [
        "Intermittent rain forecasted next week; hold manual watering sessions.",
        "Ensure compost bins are covered to prevent high humidity mold."
      ];
    }

    return {
      seasonalWarnings,
      optimalShadingNeeded
    };
  }
};
