"use client";

import React, { useState, useEffect } from "react";
import { useTwinState } from "./TwinStateManager";
import { useLanguage } from "@/components/common/LanguageContext";
import { TwinModel, PredictionData } from "@/types/digitalTwin";
import { TwinPredictionEngine } from "@/services/twinPredictionEngine";
import { TwinSimulationEngine, FutureSimulationResult } from "@/services/twinSimulationEngine";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  ShieldAlert, 
  Activity, 
  Compass, 
  Calendar, 
  Droplet, 
  Wrench,
  Sparkles,
  Info,
  Save,
  CheckSquare,
  ChevronRight,
  TrendingDown,
  LineChart
} from "lucide-react";

export default function TwinPredictiveDashboard() {
  const { t } = useLanguage();
  const { twin, setTwin } = useTwinState();

  const [predictions, setPredictions] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Future Simulator states (Feature 3)
  const [selectedSim, setSelectedSim] = useState<string>("add_bags");
  const [simResult, setSimResult] = useState<FutureSimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Initialize and run predictive analysis
  useEffect(() => {
    if (twin) {
      runPredictiveEngine(twin);
    }
  }, [twin?.zones]);

  const runPredictiveEngine = async (currentTwin: TwinModel) => {
    setLoading(true);
    try {
      // Generate predictive data client-side
      const generated = TwinPredictionEngine.generatePredictions(currentTwin);
      setPredictions(generated);

      // Auto-save initial snapshot if not already present or older
      if (!currentTwin.predictions || !currentTwin.predictions.healthScore) {
        if (currentTwin.id) {
          await TwinPredictionEngine.savePredictionSnapshot(currentTwin.id, generated, 88);
          // Update local state
          setTwin(prev => prev ? { ...prev, predictions: generated } : null);
        }
      }
    } catch (err) {
      console.error("Failed to run predictive engine:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSnapshot = async () => {
    if (!predictions || !twin || !twin.id) return;
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await TwinPredictionEngine.savePredictionSnapshot(twin.id, predictions, 90);
      setSaveSuccess(true);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save prediction snapshot.");
    }
  };

  // Run change simulation
  const handleSimulateChange = () => {
    if (!twin) return;
    setIsSimulating(true);
    setTimeout(() => {
      const res = TwinSimulationEngine.simulateFutureChange(twin, selectedSim);
      setSimResult(res);
      setIsSimulating(false);
    }, 500);
  };

  if (loading || !predictions) {
    return (
      <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-gray-400 space-y-3">
        <Activity className="animate-spin text-green-700 mx-auto" size={32} />
        <p className="text-sm font-semibold">Running predictive forecast models...</p>
      </div>
    );
  }

  // Resolve color tags for scores
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Excellent" };
    if (score >= 70) return { text: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-200", label: "Good" };
    if (score >= 50) return { text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", label: "Fair" };
    return { text: "text-red-500", bg: "bg-red-50", border: "border-red-200", label: "Needs Improvement" };
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "high": return { text: "text-red-600", bg: "bg-red-50 border-red-200", badge: "🔴 High" };
      case "medium": return { text: "text-amber-500", bg: "bg-amber-50/50 border-amber-200", badge: "🟡 Medium" };
      default: return { text: "text-green-600", bg: "bg-green-50 border-green-200", badge: "🟢 Low" };
    }
  };

  const healthColor = getScoreColor(predictions.healthScore);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Predictive Summary & Snapshot Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
        <div className="flex gap-4 items-center">
          {/* Health Gauge */}
          <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="36" cy="36" r="30" fill="none" stroke="#f1f5f9" strokeWidth="5" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="currentColor" strokeWidth="5"
                className={healthColor.text}
                strokeDasharray={2 * Math.PI * 30}
                strokeDashoffset={2 * Math.PI * 30 * (1 - predictions.healthScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-base font-black ${healthColor.text}`}>{predictions.healthScore}%</span>
          </div>

          <div>
            <h4 className="font-extrabold text-gray-800 text-sm">
              Projected Layout Health Score
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Estimated general health of the terrace layout 14 days from now based on current trends.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto md:ml-0">
          {saveSuccess && (
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1 rounded-xl border border-green-200 animate-in fade-in">
              Snapshot saved!
            </span>
          )}
          <Button
            onClick={handleManualSnapshot}
            className="rounded-xl px-4 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5"
          >
            <Save size={14} />
            <span>Create Snapshot Log</span>
          </Button>
        </div>
      </div>

      {/* 2. Risks Panel & Action Plan Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Risks predictions */}
        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-black text-gray-800 text-base flex items-center gap-1.5 border-b pb-3.5">
            <ShieldAlert className="text-red-500 animate-pulse" size={18} />
            <span>Future Risk Prediction Report</span>
          </h3>

          <div className="space-y-3.5">
            {predictions.risks.map((risk) => {
              const colors = getRiskLevelColor(risk.level);
              return (
                <div key={risk.riskType} className={`border p-4 rounded-2xl ${colors.bg} space-y-2`}>
                  <div className="flex justify-between items-center text-xs font-black">
                    <span className="capitalize text-slate-800 tracking-wide">
                      {risk.riskType.replace("_", " ")} Risk
                    </span>
                    <span className="text-[10px]">{colors.badge}</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-650 leading-relaxed">
                    {risk.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Action Plan Timeline */}
        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-black text-gray-800 text-base flex items-center gap-1.5 border-b pb-3.5">
            <CheckSquare className="text-green-700" size={18} />
            <span>AI Predictive Action Plan</span>
          </h3>

          <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6 text-xs font-semibold">
            {/* Today */}
            <div className="relative space-y-2">
              <span className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-green-700 ring-4 ring-green-100" />
              <span className="text-[10px] text-green-700 font-extrabold uppercase tracking-wider block">Today</span>
              <ul className="space-y-1.5 text-gray-700 leading-normal list-inside list-disc">
                {predictions.actions.today.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Tomorrow */}
            <div className="relative space-y-2">
              <span className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
              <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-wider block">Tomorrow</span>
              <ul className="space-y-1.5 text-gray-600 leading-normal list-inside list-disc">
                {predictions.actions.tomorrow.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>

            {/* 7 Days */}
            <div className="relative space-y-2">
              <span className="absolute -left-[30px] top-1 w-2.5 h-2.5 rounded-full bg-slate-400 ring-4 ring-slate-100" />
              <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Within 7 Days</span>
              <ul className="space-y-1.5 text-gray-650 leading-normal list-inside list-disc">
                {predictions.actions.within7Days.map((act, i) => (
                  <li key={i}>{act}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>

      {/* 3. Harvest Forecast & Resources Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Harvest Forecast (Feature 4) */}
        <div className="lg:col-span-2 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
          <h3 className="font-black text-gray-800 text-base flex items-center gap-1.5 border-b pb-3.5">
            <Calendar className="text-green-700" size={18} />
            <span>Yield & Harvest Window Forecast</span>
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            {predictions.harvests.map((har, i) => (
              <div key={har.zoneId || i} className="border border-gray-100 p-4 rounded-2xl bg-slate-50/40 text-xs font-semibold space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center border-b pb-1.5 border-gray-100">
                    <span className="font-bold text-gray-700 truncate">{har.cropName}</span>
                    <span className="text-[9px] font-mono text-gray-450 uppercase">{har.zoneName}</span>
                  </div>
                  <div className="space-y-1 mt-2">
                    <p className="text-gray-500">Harvest Window: <span className="font-bold text-slate-800">{har.harvestWindow}</span></p>
                    <p className="text-gray-500">Expected Yield: <span className="font-bold text-green-700">{har.expectedQuantity}</span></p>
                  </div>
                </div>

                <div className="pt-2 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center text-[10px] font-extrabold text-slate-700">
                  <span>Market Value: ₹{har.marketValue}</span>
                  <span className="text-green-700 bg-green-50 px-2 py-0.5 rounded-md">Confidence: {har.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Resource Forecast (Feature 5) */}
        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5 h-full">
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide border-b pb-3 flex items-center gap-1.5">
            <Droplet className="text-sky-500" size={16} />
            <span>7-Day Resource Demand</span>
          </h4>

          <div className="space-y-4 text-xs font-semibold leading-normal">
            
            {/* Water Needed */}
            <div className="bg-sky-50/30 border border-sky-100 p-3 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-gray-450 block text-[9px] font-bold uppercase">Estimated Irrigation</span>
                <span className="font-black text-sky-600 text-sm">{predictions.resources.waterNeeded7Days} Liters</span>
              </div>
              <span className="text-xl">💧</span>
            </div>

            {/* Organic fertilizer */}
            <div className="bg-green-50/20 border border-green-100 p-3 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-gray-450 block text-[9px] font-bold uppercase">Organic Nutrients Needed</span>
                <span className="font-black text-green-700 text-sm">{predictions.resources.organicFertilizerNeeded} grams</span>
              </div>
              <span className="text-xl">🌱</span>
            </div>

            {/* Compost */}
            <div className="bg-amber-50/20 border border-amber-100 p-3 rounded-xl flex justify-between items-center">
              <div>
                <span className="text-gray-450 block text-[9px] font-bold uppercase">Compost Replenishment</span>
                <span className="font-black text-amber-700 text-sm">{predictions.resources.compostRequirement} kg</span>
              </div>
              <span className="text-xl">🍂</span>
            </div>

            {/* Labor Effort */}
            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100 text-gray-500 font-extrabold text-[11px]">
              <span>Projected Care Effort:</span>
              <span className={`uppercase font-black text-xs ${
                predictions.resources.maintenanceEffort === "high" ? "text-red-500" :
                predictions.resources.maintenanceEffort === "medium" ? "text-amber-500" : "text-green-600"
              }`}>
                {predictions.resources.maintenanceEffort}
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* 4. Scenario Future Projections Simulator (Feature 3) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-6">
        <div className="border-b pb-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5">
            <LineChart className="text-green-700 animate-bounce" size={20} />
            <span>AI Future Planning Simulator</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Simulate prospective actions and preview projected differences in resource levels, productivity outputs, and weekly care workloads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Controls */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Simulate Action</label>
              <select
                value={selectedSim}
                onChange={(e) => setSelectedSim(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="add_bags">🎒 Add new Grow Bags</option>
                <option value="remove_bags">🚫 Remove active Grow Bags</option>
                <option value="change_crop">🌾 Change Crop Variety alignments</option>
                <option value="increase_budget">💸 Increase Budget & Smart sensors</option>
                <option value="add_hydroponics">💧 Convert area to Hydroponics</option>
                <option value="install_shade">⛱️ Install Shade net covers</option>
              </select>
            </div>

            <Button
              onClick={handleSimulateChange}
              disabled={isSimulating}
              className="w-full rounded-xl py-3 bg-green-700 hover:bg-green-800 text-white font-bold text-xs cursor-pointer flex items-center justify-center"
            >
              {isSimulating ? "Running simulations..." : "Calculate Predictions"}
            </Button>
          </div>

          {/* Results comparison */}
          <div className="lg:col-span-2 space-y-6">
            {simResult ? (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                  Projected Metric Differences
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  
                  {/* Productivity */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Productivity</span>
                    <span className={`text-lg font-black block mt-1 ${
                      simResult.productivityDiff >= 0 ? "text-green-700" : "text-red-500"
                    }`}>
                      {simResult.productivityDiff >= 0 ? `+${simResult.productivityDiff}%` : `${simResult.productivityDiff}%`}
                    </span>
                  </div>

                  {/* Water usage */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Water Usage</span>
                    <span className={`text-lg font-black block mt-1 ${
                      simResult.waterUsageDiff <= 0 ? "text-green-700" : "text-amber-500"
                    }`}>
                      {simResult.waterUsageDiff >= 0 ? `+${simResult.waterUsageDiff}%` : `${simResult.waterUsageDiff}%`}
                    </span>
                  </div>

                  {/* Estimated Yield */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Expected Yield</span>
                    <span className={`text-lg font-black block mt-1 ${
                      simResult.yieldDiff >= 0 ? "text-green-700" : "text-red-500"
                    }`}>
                      {simResult.yieldDiff >= 0 ? `+${simResult.yieldDiff}%` : `${simResult.yieldDiff}%`}
                    </span>
                  </div>

                  {/* Maintenance load */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Care Load</span>
                    <span className={`text-lg font-black block mt-1 ${
                      simResult.maintenanceDiff <= 0 ? "text-green-700" : "text-amber-500"
                    }`}>
                      {simResult.maintenanceDiff >= 0 ? `+${simResult.maintenanceDiff}%` : `${simResult.maintenanceDiff}%`}
                    </span>
                  </div>

                </div>

                {/* Simulated gains checklist */}
                <div className="space-y-2 text-xs font-semibold">
                  <span className="text-[9px] text-gray-400 font-black uppercase tracking-wider block">Gains & Explanations</span>
                  <ul className="space-y-1.5 leading-relaxed">
                    {simResult.projectedGains.map((gain, i) => (
                      <li key={i} className="flex gap-2 items-center text-gray-700">
                        <span className="text-green-700 font-bold">✓</span>
                        <span>{gain}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[160px] rounded-2xl border border-dashed flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-2">
                <LineChart size={24} className="text-gray-300" />
                <h5 className="font-extrabold text-sm text-gray-650">Future Simulator Standing By</h5>
                <p className="text-xs max-w-xs">
                  Choose a layout modification to calculate projected yields and workload variations.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
