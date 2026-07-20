import { TwinZone, HarvestForecastItem } from "@/types/digitalTwin";

export const TwinHarvestEstimator = {
  /**
   * Forecasts harvest timings, yields, values and confidence indexes for active crop zones
   */
  estimateHarvests(zones: TwinZone[]): HarvestForecastItem[] {
    const forecasts: HarvestForecastItem[] = [];
    
    // Filter zones with active crop plantings
    const activeCropZones = zones.filter((z) => 
      ["crop", "hydroponics", "grow_bags"].includes(z.zoneType) && 
      z.currentCrop && 
      z.currentCrop !== "None" && 
      z.currentCrop.trim() !== ""
    );

    activeCropZones.forEach((z) => {
      const crop = z.currentCrop || "Unknown Crop";
      const cropKey = crop.toLowerCase();
      
      let harvestWindow = "";
      let expectedQuantity = "";
      let marketValue = 0;
      let confidence = 85;

      // Base date calculations (relative to July 12, 2026 current context)
      if (cropKey.includes("tomato")) {
        harvestWindow = "Sep 15 - Sep 25, 2026";
        expectedQuantity = "12-16 kg";
        marketValue = 450; // INR / generic units
      } else if (cropKey.includes("chilli") || cropKey.includes("pepper")) {
        harvestWindow = "Sep 02 - Sep 12, 2026";
        expectedQuantity = "4-6 kg";
        marketValue = 200;
      } else if (cropKey.includes("spinach") || cropKey.includes("lettuce") || cropKey.includes("mint") || cropKey.includes("coriander")) {
        harvestWindow = "Aug 08 - Aug 15, 2026";
        expectedQuantity = "5-8 kg";
        marketValue = 350;
      } else if (cropKey.includes("hydroponics") || z.zoneType === "hydroponics") {
        harvestWindow = "Aug 12 - Aug 20, 2026";
        expectedQuantity = "8-10 kg";
        marketValue = 600;
      } else {
        harvestWindow = "Aug 25 - Sep 05, 2026";
        expectedQuantity = "6-9 kg";
        marketValue = 300;
      }

      // Adjust based on healthStatus
      if (z.healthStatus === "healthy") {
        confidence = 92;
      } else if (z.healthStatus === "attention") {
        confidence = 70;
        // Reduce yield quantity slightly
        expectedQuantity = expectedQuantity.replace(/\d+/g, (m) => String(Math.round(Number(m) * 0.8)));
        marketValue = Math.round(marketValue * 0.8);
      } else if (z.healthStatus === "critical") {
        confidence = 45;
        // Drastically reduce yield quantity
        expectedQuantity = expectedQuantity.replace(/\d+/g, (m) => String(Math.round(Number(m) * 0.4)));
        marketValue = Math.round(marketValue * 0.4);
      }

      forecasts.push({
        zoneId: z.zoneId,
        zoneName: z.zoneName,
        cropName: crop,
        harvestWindow,
        expectedQuantity,
        marketValue,
        confidence
      });
    });

    // Default placeholder if no crops are currently configured
    if (forecasts.length === 0) {
      forecasts.push({
        zoneId: "demo_zone",
        zoneName: "Sample Crop Bed",
        cropName: "Leafy Greens (Planted)",
        harvestWindow: "Aug 15 - Aug 25, 2026",
        expectedQuantity: "5-7 kg",
        marketValue: 250,
        confidence: 90
      });
    }

    return forecasts;
  }
};
