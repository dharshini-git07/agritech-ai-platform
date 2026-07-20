import { TwinZone, ResourceForecast } from "@/types/digitalTwin";

export const TwinForecastService = {
  /**
   * Estimates resource consumption needs (water, compost, fertilizer) for the next 7 days
   */
  calculateResourceForecast(zones: TwinZone[]): ResourceForecast {
    let waterNeeded7Days = 0;
    let organicFertilizerNeeded = 0;
    let compostRequirement = 0;
    let maintenanceEffort: ResourceForecast["maintenanceEffort"] = "low";

    const cropZones = zones.filter((z) => ["crop", "hydroponics", "grow_bags"].includes(z.zoneType));
    const activeCropZonesCount = cropZones.filter((z) => z.currentCrop && z.currentCrop !== "None").length;

    cropZones.forEach((z) => {
      const isPlanted = z.currentCrop && z.currentCrop !== "None";
      const multiplier = isPlanted ? 1.0 : 0.2; // Even unplanted/planned zones need basic prep

      if (z.zoneType === "crop") {
        // Soil crop beds require ~12L per day
        waterNeeded7Days += Math.round(12 * 7 * multiplier);
        organicFertilizerNeeded += Math.round(200 * multiplier); // grams
        compostRequirement += Math.round(1.5 * multiplier); // kg
      } else if (z.zoneType === "grow_bags") {
        // Grow bags require ~4L per day
        waterNeeded7Days += Math.round(4 * 7 * multiplier);
        organicFertilizerNeeded += Math.round(100 * multiplier);
        compostRequirement += Math.round(0.8 * multiplier);
      } else if (z.zoneType === "hydroponics") {
        // Hydroponics has extremely low water consumption (recirculating) ~1.5L per day
        waterNeeded7Days += Math.round(1.5 * 7 * multiplier);
        organicFertilizerNeeded += Math.round(50 * multiplier); // Hydro nutrients dose
        compostRequirement += 0; // Hydro uses mineral solutions, no compost needed
      }
    });

    // Determine overall maintenance level
    const criticalCount = zones.filter((z) => z.healthStatus === "critical").length;
    if (activeCropZonesCount > 5 || criticalCount > 0) {
      maintenanceEffort = "high";
    } else if (activeCropZonesCount > 2) {
      maintenanceEffort = "medium";
    }

    return {
      waterNeeded7Days,
      organicFertilizerNeeded,
      compostRequirement,
      maintenanceEffort
    };
  }
};
