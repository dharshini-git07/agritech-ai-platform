import { db } from "@/lib/firebase";
import { doc, collection, addDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { TwinModel, PredictionData } from "@/types/digitalTwin";
import { TwinRiskAssessmentService } from "./twinRiskAssessmentService";
import { TwinHarvestEstimator } from "./twinHarvestEstimator";
import { TwinForecastService } from "./twinForecastService";

export const TwinPredictionEngine = {
  /**
   * Generates prioritized risks, resource forecasts, harvest windows and action items
   */
  generatePredictions(twin: TwinModel): PredictionData {
    const zones = twin.zones;
    
    // 1. Evaluate risks
    const risks = TwinRiskAssessmentService.assessRisks(zones);
    
    // 2. Evaluate harvest forecasts
    const harvests = TwinHarvestEstimator.estimateHarvests(zones);
    
    // 3. Evaluate resource demands
    const resources = TwinForecastService.calculateResourceForecast(zones);
    
    // 4. Formulate Action Plan items
    const today: string[] = [];
    const tomorrow: string[] = [];
    const within7Days: string[] = [];

    // Prioritize actions based on zone statuses
    const criticalZones = zones.filter((z) => z.healthStatus === "critical");
    const attentionZones = zones.filter((z) => z.healthStatus === "attention");

    criticalZones.forEach((z) => {
      today.push(`Apply organic pest treatment to ${z.zoneName} immediately.`);
    });
    
    if (resources.waterNeeded7Days > 0) {
      today.push(`Run automated watering cycle (projected ~${Math.round(resources.waterNeeded7Days / 7)}L needed).`);
    }

    if (zones.some((z) => z.zoneType === "compost")) {
      tomorrow.push("Turn and aerate organic compost bin contents.");
    } else {
      tomorrow.push("Prep organic crop mulch layer to prevent heat soil drying.");
    }
    
    attentionZones.forEach((z) => {
      tomorrow.push(`Add nitrogen inputs and monitor yellowing leaves in ${z.zoneName}.`);
    });

    within7Days.push(`Replenish organic fertilizer dosage (~${resources.organicFertilizerNeeded}g total).`);
    if (harvests.length > 0) {
      within7Days.push(`Prepare harvest crates for early ${harvests[0].cropName} yield.`);
    }

    // Calculate future projected health score
    const baseHealth = twin.intelligence?.healthScore || 85;
    const highRisksCount = risks.filter((r) => r.level === "high").length;
    const futureHealthScore = Math.max(10, baseHealth - (highRisksCount * 12));

    return {
      healthScore: futureHealthScore,
      risks,
      harvests,
      resources,
      actions: {
        today,
        tomorrow,
        within7Days
      },
      generatedAt: new Date() // Overwritten with serverTimestamp on write
    };
  },

  /**
   * Saves predictive snapshot to Firestore under digital_twins/{twinId}/predictions
   */
  async savePredictionSnapshot(twinId: string, predictions: PredictionData, confidence: number): Promise<string> {
    const twinRef = doc(db, "digital_twins", twinId);
    const snapRef = collection(twinRef, "predictions");
    
    const docRef = await addDoc(snapRef, {
      digitalTwinId: twinId,
      generatedAt: serverTimestamp(),
      predictions: {
        ...predictions,
        generatedAt: serverTimestamp()
      },
      confidence
    });

    // Also update parent digital twin document with latest predictions snapshot
    await updateDoc(twinRef, {
      predictions: {
        ...predictions,
        generatedAt: serverTimestamp()
      }
    });

    return docRef.id;
  }
};
