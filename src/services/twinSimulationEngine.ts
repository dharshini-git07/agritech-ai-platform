import { TwinModel } from "@/types/digitalTwin";

export interface FutureSimulationResult {
  simulationType: string;
  productivityDiff: number; // relative change e.g. +15%
  waterUsageDiff: number; // relative change e.g. -20%
  yieldDiff: number;
  maintenanceDiff: number;
  projectedGains: string[];
}

export const TwinSimulationEngine = {
  /**
   * Predicts how future changes impact productivity, water volume, yields and maintenance load
   */
  simulateFutureChange(twin: TwinModel, type: string): FutureSimulationResult {

    let productivityDiff = 0;
    let waterUsageDiff = 0;
    let yieldDiff = 0;
    let maintenanceDiff = 0;
    let projectedGains: string[] = [];

    switch (type) {
      case "add_bags":
        productivityDiff = 12;
        waterUsageDiff = 15; // Uses more water
        yieldDiff = 20;
        maintenanceDiff = 10;
        projectedGains = [
          "Adds up to 20kg of soil-based yield capacity.",
          "Increases daily watering demand (+15%).",
          "Requires 30 mins of extra weekly soil care."
        ];
        break;

      case "remove_bags":
        productivityDiff = -8;
        waterUsageDiff = -12;
        yieldDiff = -15;
        maintenanceDiff = -10;
        projectedGains = [
          "Reduces weekly watering workload by 12%.",
          "Lowers estimated total yield by ~15%.",
          "Frees up pathway walking space on the terrace."
        ];
        break;

      case "change_crop":
        productivityDiff = 15;
        waterUsageDiff = 5;
        yieldDiff = 18;
        maintenanceDiff = 5;
        projectedGains = [
          "Improves crop-to-sunlight matching score.",
          "Increases estimated yield output by +18%.",
          "Requires normal nutrient dosing rotation."
        ];
        break;

      case "increase_budget":
        productivityDiff = 25;
        waterUsageDiff = -10; // Optimized automated systems save water
        yieldDiff = 30;
        maintenanceDiff = -15; // Automated pumps reduce labor
        projectedGains = [
          "Enables smart solenoid automation and crop sensors.",
          "Boosts total yields by +30% due to optimized moisture levels.",
          "Reduces daily manual care effort by 15%."
        ];
        break;

      case "add_hydroponics":
        productivityDiff = 35;
        waterUsageDiff = -35; // Recirculating saves 90% water compared to soil
        yieldDiff = 40;
        maintenanceDiff = 10; // Nutrient monitoring
        projectedGains = [
          "Saves 35% of total terrace water usage.",
          "Crops grow 1.5x faster in vertical NFT channel structures.",
          "Minimizes soil-borne pest vectors and weeding tasks."
        ];
        break;

      case "install_shade":
        productivityDiff = 10;
        waterUsageDiff = -18; // Less evaporation
        yieldDiff = 15;
        maintenanceDiff = 0;
        projectedGains = [
          "Reduces high midday heat stress for sensitive greens.",
          "Reduces evaporation, saving 18% water.",
          "Prevents premature crop bolting and flower drop."
        ];
        break;
    }

    return {
      simulationType: type,
      productivityDiff,
      waterUsageDiff,
      yieldDiff,
      maintenanceDiff,
      projectedGains
    };
  }
};
