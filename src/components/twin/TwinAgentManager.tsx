"use client";

import React, { useState, useEffect } from "react";
import { useTwinState } from "./TwinStateManager";
import { useLanguage } from "@/components/common/LanguageContext";
import { AgentRunLog, MasterFarmingPlan } from "@/types/digitalTwin";
import { FarmManagerAgent } from "@/services/agents/FarmManagerAgent";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Activity, 
  Sparkles, 
  ShoppingCart, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  ListChecks, 
  ArrowRight,
  ClipboardList,
  Cpu,
  Clock
} from "lucide-react";

export default function TwinAgentManager() {
  const { t } = useLanguage();
  const { twin } = useTwinState();

  const [goalInput, setGoalInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [activePlan, setActivePlan] = useState<MasterFarmingPlan | null>(null);
  const [pastRuns, setPastRuns] = useState<AgentRunLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Predefined Goal Templates
  const suggestionTemplates = [
    "I want to grow vegetables within ₹10,000.",
    "Plan my terrace.",
    "Improve productivity.",
    "Reduce water usage.",
    "Prepare for summer."
  ];

  useEffect(() => {
    if (twin?.id) {
      loadPastRuns(twin.id);
    }
  }, [twin?.id]);

  const loadPastRuns = async (twinId: string) => {
    try {
      const runs = await FarmManagerAgent.getAgentRuns(twinId);
      setPastRuns(runs);
      if (runs.length > 0) {
        setActivePlan(runs[0].masterPlan);
      }
    } catch (err) {
      console.error("Failed to load past planner logs:", err);
    }
  };

  const handleExecute = async () => {
    if (!twin || !goalInput.trim()) return;
    setIsProcessing(true);
    setError(null);
    setActivePlan(null);
    
    // Simulate specialized agent execution stages for visual experience
    setActiveStep(1); // Routing Goal
    
    setTimeout(async () => {
      setActiveStep(2); // Running CropHealth & Weather check
      
      setTimeout(async () => {
        setActiveStep(3); // running Terrace & budget limits check
        
        setTimeout(async () => {
          setActiveStep(4); // Aggregating master strategy output
          
          try {
            const runLog = await FarmManagerAgent.orchestratePlan(twin, goalInput);
            setActivePlan(runLog.masterPlan);
            // Reload runs
            await loadPastRuns(twin.id!);
          } catch (err: any) {
            setError(err.message || "Failed to orchestrate plan.");
          } finally {
            setIsProcessing(false);
            setActiveStep(0);
          }
        }, 800);
      }, 800);
    }, 800);
  };

  const selectSuggestedGoal = (template: string) => {
    setGoalInput(template);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Orchestration Planner Input Prompt */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-6">
        <div>
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5">
            <Cpu className="text-green-700 animate-spin-slow" size={22} />
            <span>Agentic AI Farm Planning center</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Task the Farm Manager Agent with a farming objective. It will dynamically direct specialized sub-agents to construct a unified plan.
          </p>
        </div>

        {/* Form Input */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Plan my terrace to grow summer vegetables within ₹8,000..."
              className="w-full min-h-[90px] bg-slate-50/50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-700/40"
              disabled={isProcessing}
            />
          </div>

          {/* Quick templates tag */}
          <div className="flex flex-wrap gap-2.5 items-center text-xs font-semibold">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Objectives Suggestions:</span>
            {suggestionTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestedGoal(template)}
                disabled={isProcessing}
                className="bg-slate-50 border hover:bg-slate-100/70 border-slate-200/80 text-gray-700 px-3 py-1.5 rounded-xl cursor-pointer select-none text-[11px] font-bold"
              >
                {template}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-semibold leading-normal">
              Error executing agent plan: {error}
            </div>
          )}

          <Button
            onClick={handleExecute}
            disabled={isProcessing || !goalInput.trim()}
            className="rounded-xl px-5 py-3.5 bg-green-700 hover:bg-green-800 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 ml-auto"
          >
            <Bot size={14} />
            <span>Execute Master Plan</span>
          </Button>
        </div>
      </div>

      {/* 2. Process animation steps */}
      {isProcessing && (
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <h4 className="font-extrabold text-xs text-green-500 uppercase tracking-widest flex items-center gap-2">
            <Activity className="animate-pulse" size={14} />
            <span>Farm Orchestrator Agent Run Log</span>
          </h4>
          
          <div className="space-y-3.5 text-xs font-semibold leading-normal font-mono">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep >= 1 ? "bg-green-500 ring-4 ring-green-950 animate-ping" : "bg-slate-650"}`} />
              <span className={activeStep >= 1 ? "text-green-400 font-bold" : "text-gray-500"}>[1/4] FarmManager: Parsing user goal and routing to specialized sub-agents...</span>
            </div>

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep >= 2 ? "bg-green-500 ring-4 ring-green-950 animate-ping" : "bg-slate-650"}`} />
              <span className={activeStep >= 2 ? "text-green-400 font-bold" : "text-gray-500"}>[2/4] CropHealthAgent & WeatherAgent: Matching sunlight filters and checking seasonal limits...</span>
            </div>

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep >= 3 ? "bg-green-500 ring-4 ring-green-950 animate-ping" : "bg-slate-650"}`} />
              <span className={activeStep >= 3 ? "text-green-400 font-bold" : "text-gray-500"}>[3/4] TerracePlanningAgent & MarketplaceAgent: Evaluating layout area limits and budget allocations...</span>
            </div>

            {/* Step 4 */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep >= 4 ? "bg-green-500 ring-4 ring-green-950 animate-ping" : "bg-slate-650"}`} />
              <span className={activeStep >= 4 ? "text-green-400 font-bold" : "text-gray-500"}>[4/4] SchedulerAgent: Compiling daily task milestones...</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Output Master Farming Plan Grid */}
      {activePlan && !isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Plan Results */}
          <div className="lg:col-span-2 space-y-6 bg-white border border-gray-150 p-6 rounded-3xl shadow-xs">
            <div className="border-b pb-4 flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] text-green-700 font-black uppercase tracking-wider block">Unified Farming Strategy</span>
                <h3 className="font-black text-slate-800 text-lg mt-1">Master Farming Plan</h3>
              </div>
              <span className="text-xl">📋</span>
            </div>

            {/* Basic Info Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-semibold leading-normal">
              
              {/* Cost */}
              <div className="bg-slate-50 border p-3.5 rounded-2xl">
                <span className="text-gray-400 block text-[9px] uppercase">Estimated Budget</span>
                <span className="font-black text-slate-800 text-sm mt-1 block">₹{activePlan.estimatedBudget}</span>
              </div>

              {/* Yield */}
              <div className="bg-slate-50 border p-3.5 rounded-2xl">
                <span className="text-gray-400 block text-[9px] uppercase">Predicted Yield</span>
                <span className="font-black text-green-700 text-xs mt-1.5 block">{activePlan.predictedYield}</span>
              </div>

              {/* Crops count */}
              <div className="bg-slate-50 border p-3.5 rounded-2xl col-span-2 md:col-span-1">
                <span className="text-gray-400 block text-[9px] uppercase">Target Crop Species</span>
                <span className="font-black text-slate-800 text-xs mt-1.5 block truncate">
                  {activePlan.recommendedCrops.join(", ")}
                </span>
              </div>

            </div>

            {/* Layout Planning */}
            <div className="space-y-2 text-xs font-semibold">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Terrace Layout adjustments</span>
              <p className="text-gray-700 bg-slate-50/50 border p-4 rounded-2xl leading-relaxed">
                {activePlan.terracePlan}
              </p>
            </div>

            {/* Risks Assessment */}
            <div className="space-y-2 text-xs font-semibold">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Risk Report Assessment</span>
              <p className="text-red-700 bg-red-50/50 border border-red-100 p-4 rounded-2xl leading-relaxed flex gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>{activePlan.riskAssessment}</span>
              </p>
            </div>

            {/* Recommendations checklist */}
            <div className="space-y-2 text-xs font-semibold">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Orchestrator Care Recommendations</span>
              <ul className="space-y-2 leading-relaxed">
                {activePlan.recommendations.map((rec, i) => (
                  <li key={i} className="flex gap-2 items-center text-gray-700 bg-slate-50/40 p-3 rounded-xl border border-slate-100">
                    <span className="text-green-700 font-bold">✓</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Timeline schedule and shopping sidebar */}
          <div className="space-y-8">
            
            {/* Task Timeline */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide border-b pb-3 flex items-center gap-1.5">
                <Calendar className="text-green-700" size={16} />
                <span>Plan task Schedule</span>
              </h4>

              <div className="relative border-l border-slate-100 pl-5 ml-2.5 space-y-4.5 text-xs font-semibold">
                {activePlan.taskSchedule.map((sch, i) => (
                  <div key={i} className="relative space-y-1">
                    <span className="absolute -left-[27px] top-1 w-2 h-2 rounded-full bg-green-700 ring-4 ring-green-50" />
                    <span className="text-[9px] text-green-700 font-extrabold uppercase tracking-wide block">{sch.time}</span>
                    <p className="text-gray-700 leading-normal">{sch.task}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shopping List checklist */}
            <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide border-b pb-3 flex items-center gap-1.5">
                <ShoppingCart className="text-sky-500" size={16} />
                <span>Suggested Marketplace Inputs</span>
              </h4>

              <div className="space-y-3.5 text-xs font-semibold leading-normal">
                {activePlan.shoppingList.map((item, i) => (
                  <div key={i} className="bg-slate-50 border p-3 rounded-xl flex justify-between items-center gap-2">
                    <div>
                      <span className="font-bold text-gray-750 block">{item.name}</span>
                      <span className="text-[9px] text-gray-400 block mt-0.5">{item.purpose}</span>
                    </div>
                    <span className="text-green-700 font-black shrink-0">₹{item.estimatedPrice}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 4. Past Agentic Plans lists (Feature 8) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-black text-gray-800 text-base border-b pb-3 flex items-center gap-1.5">
          <Clock className="text-green-700" size={18} />
          <span>Execution History Strategy Logs</span>
        </h3>

        {pastRuns.length > 0 ? (
          <div className="divide-y divide-gray-100 max-h-[250px] overflow-y-auto pr-1">
            {pastRuns.map((run, i) => (
              <button
                key={run.id || i}
                onClick={() => setActivePlan(run.masterPlan)}
                className="w-full text-left py-3.5 px-2 hover:bg-slate-50/50 rounded-xl transition flex justify-between items-center text-xs font-semibold cursor-pointer select-none"
              >
                <div className="space-y-1 min-w-0 pr-4">
                  <span className="text-[10px] text-gray-400 block">
                    {run.timestamp ? new Date(run.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                  </span>
                  <span className="text-slate-800 font-bold block truncate">
                    Goal: &ldquo;{run.userGoal}&rdquo;
                  </span>
                </div>
                <ArrowRight size={14} className="text-gray-400 shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-gray-400 font-semibold italic">No previous planning master strategies logged.</div>
        )}
      </div>

    </div>
  );
}
