import { TwinModel } from "@/types/digitalTwin";

export const MarketplaceAgent = {
  name: "MarketplaceAgent",
  responsibility: "Cost estimates, store inventories matching, budget calculations and seed sourcing",

  /**
   * Generates custom shopping checklists fitting the user budget limits
   */
  async execute(twin: TwinModel, goal: string) {
    const goalLower = goal.toLowerCase();
    
    // Parse budget from goal if present (e.g. ₹10,000 or 10000)
    let parsedBudget = 5000;
    const match = goal.match(/(\d+[,.]\d+|\d+)/);
    if (match) {
      parsedBudget = Number(match[0].replace(/,/g, ""));
    }

    let itemsList = [
      { name: "Organic Tomato Seeds (Pack of 5)", estimatedPrice: 120, purpose: "Active crop seeding" },
      { name: "Compost & Manure Mix (10 kg)", estimatedPrice: 350, purpose: "Soil preparation" },
      { name: "Coco Peat block (5 kg)", estimatedPrice: 220, purpose: "Moisture retention" }
    ];

    if (goalLower.includes("summer") || goalLower.includes("heat")) {
      itemsList.push(
        { name: "Green Shading Net (50% block, 3x4m)", estimatedPrice: 850, purpose: "Sunburn filtration" },
        { name: "Mulching Straw bundle", estimatedPrice: 180, purpose: "Soil heat insulation" }
      );
    } else if (goalLower.includes("water") || goalLower.includes("productivity")) {
      itemsList.push(
        { name: "Drip Irrigation Solenoid kit", estimatedPrice: 2400, purpose: "Irrigation automation" },
        { name: "Foliar Nitrogen spray (500ml)", estimatedPrice: 320, purpose: "Leafy crop nourishment" }
      );
    }

    // Filter shopping list items to fit budget
    let estimatedCost = itemsList.reduce((sum, item) => sum + item.estimatedPrice, 0);
    if (estimatedCost > parsedBudget) {
      // Scale down to budget limits
      itemsList = itemsList.filter(item => item.estimatedPrice < parsedBudget);
      estimatedCost = itemsList.reduce((sum, item) => sum + item.estimatedPrice, 0);
    }

    return {
      estimatedCost,
      itemsList
    };
  }
};
