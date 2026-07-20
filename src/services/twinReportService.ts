import { TwinModel, TwinReportData } from "@/types/digitalTwin";

export const TwinReportService = {
  /**
   * Compiles virtual replica parameters, zones arrays, recommendations, and action plans into exportable reports.
   */
  generateReport(twin: TwinModel): TwinReportData {
    const zonesList = twin.zones.map((z) => ({
      name: z.zoneName,
      type: z.zoneType,
      health: z.healthStatus || "unconfigured",
      crop: z.currentCrop && z.currentCrop !== "None" ? z.currentCrop : "None",
      area: z.area || Math.round(z.coordinates.w * z.coordinates.h * 0.1)
    }));

    const recommendations = (twin.intelligence?.recommendations || []).map(
      (r) => `${r.title} - ${r.description} (Estimated Impact: ${r.impact})`
    );
    
    const actions: string[] = [];
    if (twin.predictions?.actions) {
      actions.push(...twin.predictions.actions.today.map((a) => `[Today] ${a}`));
      actions.push(...twin.predictions.actions.tomorrow.map((a) => `[Tomorrow] ${a}`));
      actions.push(...twin.predictions.actions.within7Days.map((a) => `[Within 7 Days] ${a}`));
    } else {
      actions.push("Conduct standard weeding and inspect drip line pressure levels.");
    }

    return {
      twinId: twin.id || "twin_default",
      generatedAt: new Date().toLocaleString(),
      healthScore: twin.intelligence?.healthScore || 85,
      efficiencyScore: twin.intelligence?.farmingEfficiency || 80,
      sustainabilityScore: twin.intelligence?.sustainability || 75,
      totalZones: twin.zones.length,
      totalCrops: twin.zones.filter((z) => z.currentCrop && z.currentCrop !== "None").length,
      zonesList,
      recommendations: recommendations.slice(0, 5),
      actions: actions.slice(0, 6)
    };
  }
};
