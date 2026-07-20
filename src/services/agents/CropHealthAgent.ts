import { TwinModel } from "@/types/digitalTwin";

export const CropHealthAgent = {
  name: "CropHealthAgent",
  responsibility: "Crop recommendations, soil conditions, suitability assessments",

  /**
   * Recommends crops based on digital twin sunlight profiles and area context
   */
  async execute(twin: TwinModel, goal: string) {
    const zones = twin.zones;
    const highSunlightCount = zones.filter(z => z.sunlight === "high").length;
    
    let recommendedCrops: string[] = ["Tomatoes", "Chilli", "Coriander"];
    let suitabilityDetails = "Standard crops suitable for general warm climates with direct sunlight.";

    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes("summer") || goalLower.includes("heat")) {
      recommendedCrops = ["Mint", "Okra", "Cucumber", "Amaranthus"];
      suitabilityDetails = "Heat-tolerant crop selections recommended to mitigate summer moisture drying.";
    } else if (goalLower.includes("water") || goalLower.includes("saving")) {
      recommendedCrops = ["Spinach", "Mint", "Microgreens", "Fenugreek"];
      suitabilityDetails = "Low-water requirement leafy greens recommended for resource conservation.";
    } else if (highSunlightCount > 3) {
      recommendedCrops = ["Tomatoes", "Capsicum", "Eggplant", "Basil"];
      suitabilityDetails = "High sunlight levels detected across multiple zones; perfect for solanaceous fruiting crops.";
    }

    return {
      recommendedCrops,
      suitabilityDetails
    };
  }
};
