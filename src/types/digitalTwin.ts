/**
 * TypeScript Data Models for AI Digital Twin Foundation
 */

export type TwinZoneType = 
  | "boundary" 
  | "walkway" 
  | "crop" 
  | "hydroponics" 
  | "compost" 
  | "water_tank" 
  | "irrigation"
  | "grow_bags";

export interface ZoneCoordinates {
  x: number; // 0-100 grid x percentage
  y: number; // 0-100 grid y percentage
  w: number; // grid width percentage
  h: number; // grid height percentage
}

export interface IotSensorsPlaceholder {
  esp32Status: "online" | "offline";
  soilMoisture?: string; // e.g. "34%" (placeholder)
  temperature?: string;  // e.g. "28°C" (placeholder)
  humidity?: string;     // e.g. "65%" (placeholder)
  waterLevel?: string;   // e.g. "80%" (placeholder)
  pumpStatus?: "on" | "off";
}

export interface TwinZone {
  zoneId: string;
  zoneType: TwinZoneType;
  zoneName: string;
  coordinates: ZoneCoordinates;
  recommendedCrop: string;
  sunlight: "high" | "partial" | "shade";
  wateringRequirement: "high" | "medium" | "low";
  maintenanceNotes: string;
  status: "active" | "inactive" | "planning";
  futureSensorId: string; // Placeholder Sensor ID (e.g. "esp32_zone_A")
  sensors: IotSensorsPlaceholder;
  
  // Custom interactive & edit-mode configurations (SP6.1)
  currentCrop?: string;
  sunlightHours?: number;
  area?: number;
  color?: string;
  notes?: string;
  healthStatus?: "healthy" | "attention" | "critical" | "unconfigured";
  pumpId?: string;
  valveId?: string;
  cameraId?: string;
}

export interface AIRecommendationItem {
  id: string;
  title: string;
  description: string;
  reason: string;
  impact: string;
  zoneId?: string;
  category: "crop" | "spacing" | "compost" | "shade" | "water" | "other";
}

export interface TwinInsights {
  strengths: string[];
  weaknesses: string[];
  immediateActions: string[];
  longTermImprovements: string[];
  estimatedImpact: string;
}

export interface EfficiencyMetrics {
  spaceUtilization: number; // percentage (0 - 100)
  cropDiversity: number; // unique crops count
  waterEfficiency: number; // percentage (0 - 100)
  sunlightUtilization: number; // percentage (0 - 100)
  estimatedProductivity: number; // percentage (0 - 100)
}

export interface ScenarioSimulation {
  id: string;
  scenarioType: "add_bags" | "convert_hydro" | "move_tank" | "change_crops";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp: any; // Firestore Timestamp
  notes: string;
  projectedHealthScore: number;
  projectedEfficiency: number;
  projectedSustainability: number;
  projectedProductivity: number;
  gains: string[];
}

export interface TwinIntelligenceData {
  healthScore: number;
  farmingEfficiency: number;
  sustainability: number;
  recommendations: AIRecommendationItem[];
  insights: TwinInsights;
  metrics: EfficiencyMetrics;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generatedAt: any; // Firestore Timestamp
}

export interface RiskPredictionItem {
  riskType: "disease" | "water_stress" | "heat_stress" | "nutrient" | "overcrowding";
  level: "low" | "medium" | "high";
  reason: string;
}

export interface HarvestForecastItem {
  zoneId: string;
  zoneName: string;
  cropName: string;
  harvestWindow: string; // e.g. "Aug 12 - Aug 20"
  expectedQuantity: string; // e.g. "5-7 kg"
  marketValue: number; // estimated value
  confidence: number; // percentage
}

export interface ResourceForecast {
  waterNeeded7Days: number; // in liters
  organicFertilizerNeeded: number; // in grams
  compostRequirement: number; // in kg
  maintenanceEffort: "low" | "medium" | "high";
}

export interface AIActionPlan {
  today: string[];
  tomorrow: string[];
  within7Days: string[];
}

export interface PredictionData {
  healthScore: number;
  risks: RiskPredictionItem[];
  harvests: HarvestForecastItem[];
  resources: ResourceForecast;
  actions: AIActionPlan;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generatedAt: any; // Firestore Timestamp
}

export interface PredictionSnapshot {
  id?: string;
  digitalTwinId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  generatedAt: any; // Firestore Timestamp
  predictions: PredictionData;
  confidence: number;
}

export interface TwinModel {
  id?: string;
  uid: string;
  analysisId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysisDate: any; // Firestore Timestamp
  confidence: number;
  confidenceReason: string[];
  zones: TwinZone[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  version: number;
  
  // SP6.2 additions
  intelligence?: TwinIntelligenceData;
  simulations?: ScenarioSimulation[];

  // SP6.3 additions
  predictions?: PredictionData;
}

export interface TimelineEventItem {
  id?: string;
  eventType: "twin_created" | "twin_updated" | "crop_changed" | "recommendation_applied" | "prediction_history" | "iot_alert" | "automation_log";
  description: string;
  userAction: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp: any; // Firestore Timestamp
}

export interface VersionHistoryItem {
  id?: string;
  version: number;
  zones: TwinZone[];
  intelligence: TwinIntelligenceData | null;
  predictions: PredictionData | null;
  generatedBy: string;
  reasonForUpdate: string;
  status: "active" | "archived";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp: any; // Firestore Timestamp
}

export interface ComparisonReport {
  versionA: number;
  versionB: number;
  addedZones: string[];
  removedZones: string[];
  cropChanges: string[];
  healthScoreDiff: number;
  efficiencyDiff: number;
  sustainabilityDiff: number;
}

export interface TwinReportData {
  twinId: string;
  generatedAt: string;
  healthScore: number;
  efficiencyScore: number;
  sustainabilityScore: number;
  totalZones: number;
  totalCrops: number;
  zonesList: { name: string; type: string; health: string; crop: string; area: number }[];
  recommendations: string[];
  actions: string[];
}

export interface MasterFarmingPlan {
  goals: string[];
  recommendedCrops: string[];
  terracePlan: string;
  shoppingList: { name: string; estimatedPrice: number; purpose: string }[];
  estimatedBudget: number;
  predictedYield: string;
  taskSchedule: { time: string; task: string }[];
  riskAssessment: string;
  recommendations: string[];
}

export interface AgentRunLog {
  id?: string;
  userGoal: string;
  agentResponses: {
    cropHealth?: { recommendedCrops: string[]; suitabilityDetails: string };
    terracePlanning?: { zoningSummary: string; layoutEfficiency: number };
    weather?: { seasonalWarnings: string[]; optimalShadingNeeded: boolean };
    marketplace?: { estimatedCost: number; itemsList: { name: string; estimatedPrice: number; purpose: string }[] };
    scheduler?: { eventsTimeline: { time: string; task: string }[] };
  };
  masterPlan: MasterFarmingPlan;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp: any; // Firestore Timestamp
}
