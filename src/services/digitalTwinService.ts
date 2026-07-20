import { 
  addDoc, 
  collection, 
  getDocs, 
  query, 
  serverTimestamp, 
  where 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TerraceAnalysis } from "@/types/terrace";
import { TwinModel, TwinZone } from "@/types/digitalTwin";

export const DigitalTwinService = {
  /**
   * Generates and saves a new Digital Twin layout from Terrace Analysis outputs
   */
  async generateAndSaveTwin(
    userId: string, 
    analysisId: string, 
    analysis: TerraceAnalysis
  ): Promise<string> {
    const isHydroponicsSuitable = 
      analysis.hydroponicsSuitability?.toLowerCase().includes("suit") ||
      analysis.hydroponicsSuitability?.toLowerCase().includes("yes") ||
      analysis.hydroponicsSuitability?.toLowerCase().includes("high");

    const crops = analysis.recommendedCrops || ["Tomato", "Spinach", "Chilli", "Mint"];
    const cropA = crops[0] || "Tomatoes";
    const cropB = crops[1] || crops[0] || "Spinach";
    
    // Parse confidence value (e.g., "94%" -> 94)
    const confidenceVal = parseInt(analysis.confidence?.replace("%", "") || "90");

    const zones: TwinZone[] = [
      // 1. Walkway
      {
        zoneId: "walkway_1",
        zoneType: "walkway",
        zoneName: "Central Walkway",
        coordinates: { x: 45, y: 10, w: 10, h: 80 },
        recommendedCrop: "None",
        sunlight: "partial",
        wateringRequirement: "low",
        maintenanceNotes: "Keep clean. Keep clear of trailing vines.",
        status: "active",
        futureSensorId: "esp32_walk_01",
        sensors: {
          esp32Status: "offline"
        },
        currentCrop: "None",
        sunlightHours: 4,
        area: 80,
        healthStatus: "unconfigured",
        notes: "",
        pumpId: "None",
        valveId: "None",
        cameraId: "None"
      },
      // 2. Water Tank
      {
        zoneId: "tank_1",
        zoneType: "water_tank",
        zoneName: "Main Water Tank",
        coordinates: { x: 5, y: 5, w: 15, h: 15 },
        recommendedCrop: "None",
        sunlight: "shade",
        wateringRequirement: "low",
        maintenanceNotes: "Check water volume indicators regularly.",
        status: "active",
        futureSensorId: "esp32_tank_01",
        sensors: {
          esp32Status: "offline",
          waterLevel: "80%"
        },
        currentCrop: "None",
        sunlightHours: 2,
        area: 23,
        healthStatus: "healthy",
        notes: "",
        pumpId: "None",
        valveId: "valve_tank_01",
        cameraId: "None"
      },
      // 3. Compost Bin
      {
        zoneId: "compost_1",
        zoneType: "compost",
        zoneName: "Compost Bin",
        coordinates: { x: 80, y: 80, w: 15, h: 15 },
        recommendedCrop: "None",
        sunlight: "shade",
        wateringRequirement: "low",
        maintenanceNotes: "Turn composting materials every 2 weeks.",
        status: "active",
        futureSensorId: "esp32_comp_01",
        sensors: {
          esp32Status: "offline"
        },
        currentCrop: "None",
        sunlightHours: 2,
        area: 23,
        healthStatus: "healthy",
        notes: "",
        pumpId: "None",
        valveId: "None",
        cameraId: "None"
      },
      // 4. Irrigation Area / Pump Setup
      {
        zoneId: "irrigation_1",
        zoneType: "irrigation",
        zoneName: "Drip Irrigation Pump",
        coordinates: { x: 5, y: 22, w: 15, h: 10 },
        recommendedCrop: "None",
        sunlight: "shade",
        wateringRequirement: "medium",
        maintenanceNotes: "Inspect pipe connectors and clean filters.",
        status: "active",
        futureSensorId: "esp32_pump_01",
        sensors: {
          esp32Status: "offline",
          pumpStatus: "off"
        },
        currentCrop: "None",
        sunlightHours: 2,
        area: 15,
        healthStatus: "healthy",
        notes: "",
        pumpId: "pump_main_01",
        valveId: "None",
        cameraId: "cam_pump_01"
      },
      // 5. Crop Zone A (High Sunlight)
      {
        zoneId: "crop_zone_a",
        zoneType: "crop",
        zoneName: "Sun-Loving Grow Zone",
        coordinates: { x: 10, y: 45, w: 30, h: 45 },
        recommendedCrop: cropA,
        sunlight: "high",
        wateringRequirement: "high",
        maintenanceNotes: "Staking required for heavy plants. Water twice daily in summer.",
        status: "active",
        futureSensorId: "esp32_zone_a",
        sensors: {
          esp32Status: "offline",
          soilMoisture: "35%",
          temperature: "29°C",
          humidity: "60%"
        },
        currentCrop: cropA,
        sunlightHours: 8,
        area: 135,
        healthStatus: "healthy",
        notes: "",
        pumpId: "pump_main_01",
        valveId: "valve_zone_a",
        cameraId: "cam_zone_a"
      },
      // 6. Crop Zone B (Partial Shade)
      {
        zoneId: "crop_zone_b",
        zoneType: "crop",
        zoneName: "Partial Shade Grow Zone",
        coordinates: { x: 60, y: 40, w: 32, h: 35 },
        recommendedCrop: cropB,
        sunlight: "partial",
        wateringRequirement: "medium",
        maintenanceNotes: "Protect from harsh midday sun. Excellent for greens.",
        status: "active",
        futureSensorId: "esp32_zone_b",
        sensors: {
          esp32Status: "offline",
          soilMoisture: "45%",
          temperature: "27°C",
          humidity: "65%"
        },
        currentCrop: cropB,
        sunlightHours: 5,
        area: 112,
        healthStatus: "attention",
        notes: "",
        pumpId: "pump_main_01",
        valveId: "valve_zone_b",
        cameraId: "None"
      },
      // 7. Grow Bags Zone
      {
        zoneId: "bags_1",
        zoneType: "grow_bags",
        zoneName: "Perimeter Grow Bags",
        coordinates: { x: 23, y: 5, w: 18, h: 35 },
        recommendedCrop: crops[2] || "Chilli / Coriander",
        sunlight: "high",
        wateringRequirement: "medium",
        maintenanceNotes: "Ensure standard spacing between grow bags.",
        status: "planning",
        futureSensorId: "esp32_bags_01",
        sensors: {
          esp32Status: "offline"
        },
        currentCrop: "None",
        sunlightHours: 7,
        area: 63,
        healthStatus: "unconfigured",
        notes: "",
        pumpId: "None",
        valveId: "None",
        cameraId: "None"
      }
    ];

    // If Suitable, render a dedicated Hydroponics Zone
    if (isHydroponicsSuitable) {
      zones.push({
        zoneId: "hydro_1",
        zoneType: "hydroponics",
        zoneName: "Hydroponics Channel System",
        coordinates: { x: 65, y: 5, w: 25, h: 30 },
        recommendedCrop: "Leafy Lettuce & Herbs",
        sunlight: "high",
        wateringRequirement: "high",
        maintenanceNotes: "Check EC/pH meters. Flush system every fortnight.",
        status: "planning",
        futureSensorId: "esp32_hydro_01",
        sensors: {
          esp32Status: "offline",
          temperature: "26°C",
          humidity: "70%"
        },
        currentCrop: "Leafy Lettuce & Herbs",
        sunlightHours: 8,
        area: 75,
        healthStatus: "critical",
        notes: "",
        pumpId: "pump_hydro_01",
        valveId: "None",
        cameraId: "cam_hydro_01"
      });
    }

    const docRef = await addDoc(collection(db, "digital_twins"), {
      uid: userId,
      analysisId: analysisId,
      analysisDate: serverTimestamp(),
      confidence: confidenceVal,
      confidenceReason: analysis.confidenceReason || [
        "Manual dimensions provided",
        "High-quality terrace layout",
        "Urban budget configured"
      ],
      zones: zones,
      createdAt: serverTimestamp(),
      version: 1
    });

    return docRef.id;
  },

  /**
   * Loads the latest generated twin model for a user
   */
  async getLatestTwin(userId: string): Promise<TwinModel | null> {
    const twins = await this.getUserTwins(userId);
    return twins.length > 0 ? twins[0] : null;
  },

  /**
   * Retrieves all historical digital twin runs
   */
  async getUserTwins(userId: string): Promise<TwinModel[]> {
    const q = query(
      collection(db, "digital_twins"),
      where("uid", "==", userId)
    );
    const snapshot = await getDocs(q);
    const twins = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    } as TwinModel));

    // Sort by createdAt descending client-side to avoid requiring composite indexes
    return twins.sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }
};
