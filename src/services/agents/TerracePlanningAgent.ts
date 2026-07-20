import { TwinModel } from "@/types/digitalTwin";

export const TerracePlanningAgent = {
  name: "TerracePlanningAgent",
  responsibility: "Terrace spacing, area sizing configurations, zoning density and pathway clearances",

  /**
   * Analyzes zoning sizes and coordinates configurations
   */
  async execute(twin: TwinModel, goal: string) {
    const zones = twin.zones;
    const totalArea = zones.reduce((sum, z) => sum + (z.area || 0), 0);
    const usableArea = zones
      .filter(z => ["crop", "hydroponics", "grow_bags"].includes(z.zoneType))
      .reduce((sum, z) => sum + (z.area || 0), 0);

    const layoutEfficiency = Math.round((usableArea / Math.max(1, totalArea)) * 100);
    
    let zoningSummary = `Layout utilizes ${zones.length} active zones covering ${usableArea} sq. ft. of usable grow space. Spacing is optimized with walking lanes.`;
    
    const goalLower = goal.toLowerCase();
    
    if (goalLower.includes("productivity") || goalLower.includes("grow")) {
      zoningSummary = `Recommended to expand grow bag configurations in the south-east quadrant. Usable farming space covers ${layoutEfficiency}% of terrace area.`;
    } else if (zones.length > 6) {
      zoningSummary = "High layout density. Warning: ensure walkways retain a minimum width of 2.5 feet to prevent crowding.";
    }

    return {
      zoningSummary,
      layoutEfficiency
    };
  }
};
