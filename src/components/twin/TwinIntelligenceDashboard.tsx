"use client";

import React, { useState } from "react";
import { useTwinState } from "./TwinStateManager";
import { useLanguage } from "@/components/common/LanguageContext";
import { TwinModel, ScenarioSimulation } from "@/types/digitalTwin";
import { TwinSimulationService, SimulationResult } from "@/services/twinSimulationService";
import { TwinIntelligenceService } from "@/services/twinIntelligenceService";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  TrendingUp, 
  Sparkles, 
  HelpCircle, 
  ShieldAlert, 
  Save, 
  List, 
  Zap, 
  Info,
  Clock,
  Compass
} from "lucide-react";

export default function TwinIntelligenceDashboard() {
  const { t } = useLanguage();
  const { twin, setTwin, setActiveZoneId } = useTwinState();

  const [simType, setSimType] = useState<ScenarioSimulation["scenarioType"]>("add_bags");
  const [simNotes, setSimNotes] = useState("");
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (!twin || !twin.intelligence) {
    return (
      <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-gray-400 space-y-3">
        <Activity className="animate-spin text-green-700 mx-auto" size={32} />
        <p className="text-sm font-semibold">Generating AI Decision Support reports...</p>
      </div>
    );
  }

  const { healthScore, farmingEfficiency, sustainability, recommendations, insights, metrics } = twin.intelligence;

  // Resolve color tags for scores
  const getScoreColor = (score: number) => {
    if (score >= 90) return { text: "text-green-600", bg: "bg-green-50", border: "border-green-200", label: "Excellent" };
    if (score >= 70) return { text: "text-amber-500", bg: "bg-amber-50/50", border: "border-amber-200", label: "Good" };
    if (score >= 50) return { text: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200", label: "Fair" };
    return { text: "text-red-500", bg: "bg-red-50", border: "border-red-200", label: "Needs Improvement" };
  };

  const healthColor = getScoreColor(healthScore);
  const efficiencyColor = getScoreColor(farmingEfficiency);
  const sustainabilityColor = getScoreColor(sustainability);

  // Trigger Scenario Simulation
  const handleSimulate = () => {
    setIsSimulating(true);
    // Simulate latency
    setTimeout(() => {
      const res = TwinSimulationService.runSimulation(twin, simType);
      setSimulationResult(res);
      setIsSimulating(false);
      setSaveSuccess(false);
      setSaveError(null);
    }, 600);
  };

  // Save Sim log to Firestore
  const handleSaveSimulation = async () => {
    if (!simulationResult || !twin.id) return;
    try {
      const simLog: ScenarioSimulation = {
        id: `sim_${Date.now()}`,
        scenarioType: simType,
        timestamp: new Date(),
        notes: simNotes || "Simulated optimization run.",
        projectedHealthScore: simulationResult.projectedHealthScore,
        projectedEfficiency: simulationResult.projectedEfficiency,
        projectedSustainability: simulationResult.projectedSustainability,
        projectedProductivity: simulationResult.projectedProductivity,
        gains: simulationResult.gains
      };

      await TwinIntelligenceService.saveSimulationLog(twin.id, simLog);
      
      // Update local state history
      setTwin(prev => {
        if (!prev) return null;
        return {
          ...prev,
          simulations: [simLog, ...(prev.simulations || [])]
        };
      });

      setSaveSuccess(true);
      setSimNotes("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save simulation log.";
      setSaveError(msg);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Health Gauges Column */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Gauge: Health Score */}
        <div className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between items-center text-center space-y-4 ${healthColor.border}`}>
          <div className="space-y-1">
            <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">
              {t("twinHealthScore") || "Twin Health Score"}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{healthColor.label}</p>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* SVG Progress Arc */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8"
                className={healthColor.text}
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - healthScore / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-3xl font-black ${healthColor.text}`}>{healthScore}%</span>
          </div>
        </div>

        {/* Gauge: Farming Efficiency */}
        <div className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between items-center text-center space-y-4 ${efficiencyColor.border}`}>
          <div className="space-y-1">
            <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">
              {t("farmingEfficiency") || "Farming Efficiency Score"}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{efficiencyColor.label}</p>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8"
                className={efficiencyColor.text}
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - farmingEfficiency / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-3xl font-black ${efficiencyColor.text}`}>{farmingEfficiency}%</span>
          </div>
        </div>

        {/* Gauge: Sustainability */}
        <div className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col justify-between items-center text-center space-y-4 ${sustainabilityColor.border}`}>
          <div className="space-y-1">
            <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">
              {t("sustainabilityScore") || "Sustainability Score"}
            </h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sustainabilityColor.label}</p>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r="48" fill="none" stroke="#f1f5f9" strokeWidth="8" />
              <circle cx="56" cy="56" r="48" fill="none" stroke="currentColor" strokeWidth="8"
                className={sustainabilityColor.text}
                strokeDasharray={2 * Math.PI * 48}
                strokeDashoffset={2 * Math.PI * 48 * (1 - sustainability / 100)}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-3xl font-black ${sustainabilityColor.text}`}>{sustainability}%</span>
          </div>
        </div>

      </div>

      {/* 2. Insights and Metrics Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Insights summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-6">
            <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5 border-b pb-4">
              <Sparkles className="text-green-700" size={20} />
              <span>{t("aiInsights") || "AI Insights Panel"}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <div className="space-y-3">
                <span className="text-xs font-black text-green-700 uppercase tracking-widest block flex items-center gap-1">
                  🟢 {t("topStrengths") || "Top Strengths"}
                </span>
                <ul className="space-y-2 text-xs font-semibold text-gray-600 leading-relaxed list-inside list-disc">
                  {insights.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="space-y-3">
                <span className="text-xs font-black text-red-600 uppercase tracking-widest block flex items-center gap-1">
                  🔴 {t("topWeaknesses") || "Top Weaknesses"}
                </span>
                <ul className="space-y-2 text-xs font-semibold text-gray-600 leading-relaxed list-inside list-disc">
                  {insights.weaknesses.map((wk, i) => (
                    <li key={i}>{wk}</li>
                  ))}
                </ul>
              </div>

              {/* Immediate Actions */}
              <div className="space-y-3 md:border-t md:pt-4 border-gray-100">
                <span className="text-xs font-black text-amber-600 uppercase tracking-widest block flex items-center gap-1">
                  ⚠️ {t("immediateActions") || "Immediate Actions"}
                </span>
                <ul className="space-y-2 text-xs font-semibold text-gray-700 leading-relaxed list-inside list-disc">
                  {insights.immediateActions.map((act, i) => (
                    <li key={i}>{act}</li>
                  ))}
                </ul>
              </div>

              {/* Long Term Improvement Goals */}
              <div className="space-y-3 md:border-t md:pt-4 border-gray-100">
                <span className="text-xs font-black text-blue-600 uppercase tracking-widest block flex items-center gap-1">
                  🚀 {t("longTermImprovements") || "Long-Term Goals"}
                </span>
                <ul className="space-y-2 text-xs font-semibold text-gray-600 leading-relaxed list-inside list-disc">
                  {insights.longTermImprovements.map((goal, i) => (
                    <li key={i}>{goal}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Impact Text */}
            <div className="bg-green-50/50 p-4 border border-green-100 rounded-2xl text-xs text-green-800 font-semibold leading-relaxed">
              <p className="flex gap-2">
                <Info size={16} className="shrink-0" />
                <span>{insights.estimatedImpact}</span>
              </p>
            </div>

          </div>
        </div>

        {/* Right Column: Detailed efficiency metrics list */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5 h-full">
            <h4 className="font-extrabold text-gray-800 text-sm uppercase tracking-wide border-b pb-3">
              Terrace Efficiency Analysis
            </h4>

            <div className="space-y-4 text-xs font-semibold">
              {/* Metric 1: Space Utilization */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("spaceUtilizationTitle") || "Space Utilization"}</span>
                  <span className="font-extrabold text-gray-800">{metrics.spaceUtilization}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-green-700 h-full rounded-full" style={{ width: `${metrics.spaceUtilization}%` }} />
                </div>
              </div>

              {/* Metric 2: Sunlight matches */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("sunlightUtilizationTitle") || "Sunlight Utilization"}</span>
                  <span className="font-extrabold text-gray-800">{metrics.sunlightUtilization}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${metrics.sunlightUtilization}%` }} />
                </div>
              </div>

              {/* Metric 3: Water Efficiency */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("waterEfficiencyTitle") || "Water Efficiency"}</span>
                  <span className="font-extrabold text-gray-800">{metrics.waterEfficiency}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${metrics.waterEfficiency}%` }} />
                </div>
              </div>

              {/* Metric 4: Estimated Productivity */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("estimatedProductivityTitle") || "Estimated Productivity"}</span>
                  <span className="font-extrabold text-gray-800">{metrics.estimatedProductivity}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-green-600 h-full rounded-full" style={{ width: `${metrics.estimatedProductivity}%` }} />
                </div>
              </div>

              {/* Metric 5: Crop Diversity count */}
              <div className="flex justify-between border-t border-dashed pt-3 mt-4">
                <span className="text-gray-500">{t("cropDiversityTitle") || "Crop Diversity"}:</span>
                <span className="font-extrabold text-gray-800">{metrics.cropDiversity} unique crops</span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3. AI Care Recommendations Mapped list */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5 border-b pb-4">
          <List className="text-green-700" size={20} />
          <span>{t("recommendedOptimizations") || "AI Care Recommendations"}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border border-gray-100 p-4 rounded-2xl bg-slate-50/50 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex justify-between items-start gap-3">
                  <h4 className="font-bold text-gray-800 text-sm leading-tight">{rec.title}</h4>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                    rec.category === "crop" 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : rec.category === "shade"
                      ? "bg-amber-50 border-amber-200 text-amber-700"
                      : rec.category === "water"
                      ? "bg-sky-50 border-sky-200 text-sky-700"
                      : "bg-gray-100 border-gray-200 text-gray-600"
                  }`}>
                    {rec.category}
                  </span>
                </div>
                <p className="text-xs text-gray-650">{rec.description}</p>
                <p className="text-[11px] text-gray-500 italic bg-white p-2.5 rounded-xl border border-gray-100 leading-normal">
                  <span className="font-bold text-gray-600">Reason: </span>
                  {rec.reason}
                </p>
              </div>

              <div className="pt-2 border-t border-dashed border-gray-200 mt-2 flex justify-between items-center text-[10px] text-green-700 font-extrabold">
                <span>Impact: {rec.impact}</span>
                {rec.zoneId && (
                  <button
                    onClick={() => rec.zoneId && setActiveZoneId(rec.zoneId)}
                    className="flex items-center gap-1 hover:text-green-800 transition cursor-pointer"
                  >
                    <Compass size={12} /> Find Zone
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Scenario Simulation Block */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-6">
        <div className="border-b pb-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5">
            <Zap className="text-green-700 animate-bounce" size={20} />
            <span>{t("scenarioSimulator") || "AI Layout Scenario Simulator"}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Simulate layout variations and calculate projected metric increases before saving physical changes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Simulator controls */}
          <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
            
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">
                {t("selectSimulation") || "Simulation Scenario"}
              </label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value as any)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none cursor-pointer"
              >
                <option value="add_bags">🎒 {t("addBagsSim") || "Add 10 Grow Bags"}</option>
                <option value="convert_hydro">💧 {t("convertHydroSim") || "Convert crop zone to Hydroponics"}</option>
                <option value="move_tank">🚰 {t("moveTankSim") || "Elevate Water Tank (Gravity Flow)"}</option>
                <option value="change_crops">☀️ {t("changeCropsSim") || "Optimize Crop Sunlight Matching"}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Simulation Remarks</label>
              <textarea
                value={simNotes}
                onChange={(e) => setSimNotes(e.target.value)}
                placeholder={t("simNotes") || "Add simulation notes..."}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none min-h-[60px] resize-none"
              />
            </div>

            <Button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="w-full rounded-xl py-3 bg-green-700 hover:bg-green-800 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isSimulating ? "Running projections..." : (t("runSimulation") || "Run Simulator")}
            </Button>

            {saveSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-1.5 font-bold animate-in fade-in">
                <span>✓ {t("simulationSaved") || "Simulation logged successfully!"}</span>
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5 font-bold">
                <ShieldAlert size={14} />
                <span>{saveError}</span>
              </div>
            )}

          </div>

          {/* Projection Results */}
          <div className="lg:col-span-2 space-y-5">
            {simulationResult ? (
              <div className="space-y-5 animate-in slide-in-from-bottom-2 duration-300">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">
                  {t("projectedGains") || "Projected Score comparison"}
                </h4>

                {/* Score projections grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  
                  {/* Projected Health */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Health</span>
                    <span className="text-xs text-gray-400 block line-through font-bold">{simulationResult.baseHealthScore}%</span>
                    <span className="text-lg font-black text-green-700 block mt-0.5">
                      {simulationResult.projectedHealthScore}%
                    </span>
                  </div>

                  {/* Projected Efficiency */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Efficiency</span>
                    <span className="text-xs text-gray-400 block line-through font-bold">{simulationResult.baseEfficiency}%</span>
                    <span className="text-lg font-black text-green-700 block mt-0.5">
                      {simulationResult.projectedEfficiency}%
                    </span>
                  </div>

                  {/* Projected Sustainability */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Sustainability</span>
                    <span className="text-xs text-gray-400 block line-through font-bold">{simulationResult.baseSustainability}%</span>
                    <span className="text-lg font-black text-green-700 block mt-0.5">
                      {simulationResult.projectedSustainability}%
                    </span>
                  </div>

                  {/* Projected Productivity */}
                  <div className="bg-white border rounded-2xl p-3 shadow-xs">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase block">Productivity</span>
                    <span className="text-xs text-gray-400 block line-through font-bold">{simulationResult.baseProductivity}%</span>
                    <span className="text-lg font-black text-green-700 block mt-0.5">
                      {simulationResult.projectedProductivity}%
                    </span>
                  </div>

                </div>

                {/* Projected list of gains */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Estimated Gains list</span>
                  <ul className="space-y-1.5 text-xs text-gray-700 font-semibold leading-relaxed">
                    {simulationResult.gains.map((gain, i) => (
                      <li key={i} className="flex gap-2 items-center">
                        <span className="text-green-600 font-bold">✓</span>
                        <span>{gain}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={handleSaveSimulation}
                  className="rounded-xl px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ml-auto w-fit"
                >
                  <Save size={14} />
                  <span>{t("saveSimulation") || "Save Log to History"}</span>
                </Button>
              </div>
            ) : (
              <div className="h-full min-h-[160px] rounded-2xl border border-dashed flex flex-col items-center justify-center text-center text-gray-400 p-6 space-y-2">
                <Zap size={24} className="text-gray-300" />
                <h5 className="font-extrabold text-sm text-gray-600">Simulator Standing By</h5>
                <p className="text-xs max-w-xs">
                  Choose a layout scenario and run projections to view impact scoring changes.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 5. Saved Simulation Run History logs list */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-black text-gray-800 text-sm flex items-center gap-1.5 uppercase tracking-wide border-b pb-3">
          <Clock className="text-green-700" size={16} />
          <span>{t("simulationHistory") || "Saved Simulation History"}</span>
        </h3>

        {!twin.simulations || twin.simulations.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 font-semibold">
            {t("noSimulationHistory") || "No simulation logs recorded yet."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto pr-1">
            {twin.simulations.map((sim, i) => (
              <div key={sim.id || i} className="py-3 flex flex-col sm:flex-row gap-3 sm:items-center justify-between text-xs font-semibold">
                <div className="space-y-1">
                  <div className="flex gap-2 items-center">
                    <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      {sim.scenarioType.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {sim.timestamp ? new Date(sim.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                    </span>
                  </div>
                  <p className="text-gray-600 font-medium italic">"{sim.notes}"</p>
                </div>

                <div className="flex gap-3 text-[10px] text-green-700 font-extrabold shrink-0 border-t sm:border-t-0 border-gray-50 pt-2 sm:pt-0">
                  <span>Health: {sim.projectedHealthScore}%</span>
                  <span>Eff: {sim.projectedEfficiency}%</span>
                  <span>Sus: {sim.projectedSustainability}%</span>
                  <span>Prod: {sim.projectedProductivity}%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
