import { db } from "@/lib/firebase";
import { doc, collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { TwinModel, MasterFarmingPlan, AgentRunLog } from "@/types/digitalTwin";
import { CropHealthAgent } from "./CropHealthAgent";
import { TerracePlanningAgent } from "./TerracePlanningAgent";
import { WeatherAgent } from "./WeatherAgent";
import { MarketplaceAgent } from "./MarketplaceAgent";
import { SchedulerAgent } from "./SchedulerAgent";

export const FarmManagerAgent = {
  name: "FarmManagerAgent",
  responsibility: "Central orchestration, goal parsing, agent routing and Master Plan formulation",

  /**
   * Evaluates user goal, routes to required agents, aggregates JSON logs, and saves in Firestore.
   */
  async orchestratePlan(twin: TwinModel, goal: string): Promise<AgentRunLog> {
    if (!twin || !twin.id) {
      throw new Error("Invalid Digital Twin reference context.");
    }

    const goalLower = goal.toLowerCase();
    
    // 1. Determine required agents dynamically based on keywords
    const runCropHealth = true; // Always execute crop selections
    const runScheduler = true; // Always schedule timelines
    const runPlanning = goalLower.includes("plan") || goalLower.includes("productivity") || goalLower.includes("grow") || goalLower.includes("layout");
    const runWeather = goalLower.includes("summer") || goalLower.includes("heat") || goalLower.includes("weather") || goalLower.includes("water");
    const runMarketplace = goalLower.includes("₹") || goalLower.includes("budget") || goalLower.includes("cost") || goalLower.includes("buy") || goalLower.includes("grow");

    // 2. Execute requested specialized agents
    const cropHealthRes = runCropHealth ? await CropHealthAgent.execute(twin, goal) : undefined;
    const terraceRes = runPlanning ? await TerracePlanningAgent.execute(twin, goal) : undefined;
    const weatherRes = runWeather ? await WeatherAgent.execute(twin, goal) : undefined;
    const marketRes = runMarketplace ? await MarketplaceAgent.execute(twin, goal) : undefined;
    const schedulerRes = runScheduler ? await SchedulerAgent.execute(twin, goal) : undefined;

    // 3. Synthesize Master Farming Plan
    const recommendedCrops = cropHealthRes?.recommendedCrops || ["Leafy Greens", "Tomatoes"];
    const terracePlan = terraceRes?.zoningSummary || "Utilize existing space layouts and maintain walking clearance pathways.";
    const shoppingList = marketRes?.itemsList || [
      { name: "Organic Seeds Variety Pack", estimatedPrice: 250, purpose: "Planting starter varieties" },
      { name: "Vermicompost Soil Bag (5 kg)", estimatedPrice: 180, purpose: "Soil prep feeding" }
    ];
    const estimatedBudget = marketRes?.estimatedCost || shoppingList.reduce((sum, item) => sum + item.estimatedPrice, 0);
    const predictedYield = goalLower.includes("water") ? "Estimated 8-12 kg of fresh organic greens." : "Estimated 15-25 kg of fresh organic vegetables.";
    const taskSchedule = schedulerRes?.eventsTimeline || [
      { time: "Day 1", task: "Mix potting soil and prep containers." },
      { time: "Day 3", task: "Sow seeds and mist water." }
    ];
    
    let riskAssessment = "Standard risks within normal parameters. Ensure manual watering matches sunlight.";
    if (weatherRes?.optimalShadingNeeded) {
      riskAssessment = "High warning: Midday summer heat stress risks detected. Installation of 50% green shade nets is highly recommended.";
    } else if (goalLower.includes("water")) {
      riskAssessment = "Resource risk: Monitor moisture depletion indicators on dry afternoons.";
    }

    const recommendations = [
      "Use crop rotation schedules to preserve soil mineral balances.",
      "Integrate organic compost layers weekly to optimize seedling growth rates."
    ];
    if (weatherRes?.optimalShadingNeeded) {
      recommendations.push("Install shading fabrics immediately before summer planting.");
    }

    const masterPlan: MasterFarmingPlan = {
      goals: [goal],
      recommendedCrops,
      terracePlan,
      shoppingList,
      estimatedBudget,
      predictedYield,
      taskSchedule,
      riskAssessment,
      recommendations
    };

    const agentResponses = {
      cropHealth: cropHealthRes,
      terracePlanning: terraceRes,
      weather: weatherRes,
      marketplace: marketRes,
      scheduler: schedulerRes
    };

    // 4. Save snapshot history run inside digital_twins/{twinId}/agent_runs subcollection
    const twinRef = doc(db, "digital_twins", twin.id);
    const runsRef = collection(twinRef, "agent_runs");
    
    const docRef = await addDoc(runsRef, {
      userGoal: goal,
      agentResponses,
      masterPlan,
      timestamp: serverTimestamp()
    });

    return {
      id: docRef.id,
      userGoal: goal,
      agentResponses,
      masterPlan,
      timestamp: new Date()
    };
  },

  /**
   * Fetches saved Agentic runs for a digital twin
   */
  async getAgentRuns(twinId: string): Promise<AgentRunLog[]> {
    try {
      const twinRef = doc(db, "digital_twins", twinId);
      const runsRef = collection(twinRef, "agent_runs");
      const snap = await getDocs(runsRef);
      
      const runs: AgentRunLog[] = [];
      snap.forEach((doc) => {
        runs.push({ id: doc.id, ...doc.data() } as AgentRunLog);
      });
      
      return runs.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });
    } catch (err) {
      console.error("Failed to load agent runs history:", err);
      return [];
    }
  }
};
