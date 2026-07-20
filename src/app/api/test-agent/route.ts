import { NextRequest, NextResponse } from "next/server";
import { FarmManagerAgent } from "@/services/agents/FarmManagerAgent";
import { CropHealthAgent } from "@/services/agents/CropHealthAgent";
import { TerracePlanningAgent } from "@/services/agents/TerracePlanningAgent";
import { WeatherAgent } from "@/services/agents/WeatherAgent";
import { MarketplaceAgent } from "@/services/agents/MarketplaceAgent";
import { SchedulerAgent } from "@/services/agents/SchedulerAgent";
import { TwinModel } from "@/types/digitalTwin";

export async function GET(req: NextRequest) {
  try {
    const mockTwin: TwinModel = {
      id: "mock_twin_123",
      uid: "mock_uid_123",
      analysisId: "mock_analysis_123",
      analysisDate: new Date(),
      confidence: 95,
      confidenceReason: ["Mock reason"],
      zones: [
        {
          zoneId: "crop_zone_a",
          zoneType: "crop",
          zoneName: "Sun-Loving Grow Zone",
          coordinates: { x: 10, y: 45, w: 30, h: 45 },
          recommendedCrop: "Tomatoes",
          sunlight: "high",
          wateringRequirement: "high",
          maintenanceNotes: "",
          status: "active",
          futureSensorId: "esp32_zone_a",
          sensors: { esp32Status: "offline" },
          currentCrop: "Tomatoes",
          sunlightHours: 8,
          area: 135,
          healthStatus: "healthy",
          notes: "",
          pumpId: "None",
          valveId: "None",
          cameraId: "None"
        }
      ],
      createdAt: new Date(),
      version: 1
    };

    const goal = "I want to grow summer vegetables within ₹10,000.";

    // 1. Test individual agents
    const cropHealth = await CropHealthAgent.execute(mockTwin, goal);
    const terracePlanning = await TerracePlanningAgent.execute(mockTwin, goal);
    const weather = await WeatherAgent.execute(mockTwin, goal);
    const marketplace = await MarketplaceAgent.execute(mockTwin, goal);
    const scheduler = await SchedulerAgent.execute(mockTwin, goal);

    // 2. Test orchestrator (with Firestore try-catch)
    let orchestratorResult = null;
    let firestoreSuccess = false;
    let firestoreError = null;

    try {
      orchestratorResult = await FarmManagerAgent.orchestratePlan(mockTwin, goal);
      firestoreSuccess = true;
    } catch (err: any) {
      firestoreError = err.message || err.toString();
    }

    return NextResponse.json({
      success: true,
      agents: {
        cropHealth,
        terracePlanning,
        weather,
        marketplace,
        scheduler
      },
      orchestratorResult,
      firestoreSuccess,
      firestoreError
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || error.toString()
    }, { status: 500 });
  }
}
