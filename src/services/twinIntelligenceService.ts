import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import { TwinModel, TwinIntelligenceData, ScenarioSimulation } from "@/types/digitalTwin";
import { TwinAnalysisEngine } from "./twinAnalysisEngine";
import { TwinRecommendationEngine } from "./twinRecommendationEngine";
import { InsightGenerator } from "./insightGenerator";

export const TwinIntelligenceService = {
  /**
   * Evaluates a digital twin and generates full intelligence insights and metrics
   */
  analyzeTwin(twin: TwinModel): TwinIntelligenceData {
    const zones = twin.zones;
    
    // 1. Calculate metrics
    const metrics = TwinAnalysisEngine.calculateMetrics(zones);
    
    // 2. Generate recommendations
    const recommendations = TwinRecommendationEngine.generateRecommendations(zones);
    
    // 3. Generate insights
    const insights = InsightGenerator.generateInsights(zones, metrics);
    
    // 4. Calculate health, efficiency, and sustainability base scores
    const activeZones = zones.filter((z) => z.status === "active");
    const healthyCount = activeZones.filter((z) => z.healthStatus === "healthy").length;
    const healthRatio = activeZones.length > 0 ? (healthyCount / activeZones.length) : 0.8;
    
    const healthScore = Math.round(
      (metrics.sunlightUtilization * 0.4) + 
      (healthRatio * 40) + 
      (metrics.waterEfficiency * 0.2)
    );
    
    const farmingEfficiency = Math.round(
      (metrics.spaceUtilization * 0.4) + 
      (metrics.waterEfficiency * 0.3) + 
      (metrics.sunlightUtilization * 0.3)
    );
    
    // Sustainability depends on compost, rain tank, and crop diversity
    const hasCompost = zones.some((z) => z.zoneType === "compost");
    const hasTank = zones.some((z) => z.zoneType === "water_tank");
    const sustainability = Math.round(
      (hasCompost ? 40 : 10) + 
      (hasTank ? 40 : 10) + 
      (metrics.cropDiversity > 2 ? 20 : 10)
    );

    return {
      healthScore: Math.min(100, Math.max(10, healthScore)),
      farmingEfficiency: Math.min(100, Math.max(10, farmingEfficiency)),
      sustainability: Math.min(100, Math.max(10, sustainability)),
      recommendations,
      insights,
      metrics,
      generatedAt: new Date() // Replaced by serverTimestamp on write
    };
  },

  /**
   * Saves the intelligence payload into the digital twin document in Firestore
   */
  async saveIntelligence(twinId: string, intelligence: TwinIntelligenceData): Promise<void> {
    const twinRef = doc(db, "digital_twins", twinId);
    
    await updateDoc(twinRef, {
      intelligence: {
        ...intelligence,
        generatedAt: serverTimestamp()
      }
    });
  },

  /**
   * Saves a simulated scenario run history log to Firestore
   */
  async saveSimulationLog(twinId: string, simulation: ScenarioSimulation): Promise<void> {
    const twinRef = doc(db, "digital_twins", twinId);
    
    await updateDoc(twinRef, {
      simulations: arrayUnion({
        ...simulation,
        timestamp: serverTimestamp()
      })
    });
  }
};
