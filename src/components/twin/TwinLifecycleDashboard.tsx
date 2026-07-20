"use client";

import React, { useState, useEffect } from "react";
import { useTwinState } from "./TwinStateManager";
import { useLanguage } from "@/components/common/LanguageContext";
import { VersionHistoryItem, TimelineEventItem, ComparisonReport, TwinReportData } from "@/types/digitalTwin";
import { TwinVersionService } from "@/services/twinVersionService";
import { TwinTimelineService } from "@/services/twinTimelineService";
import { TwinComparisonService } from "@/services/twinComparisonService";
import { TwinReportService } from "@/services/twinReportService";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  GitCommit, 
  RefreshCw, 
  GitCompare, 
  Printer, 
  Activity, 
  TrendingUp, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  FileText,
  FileDown
} from "lucide-react";

export default function TwinLifecycleDashboard() {
  const { t } = useLanguage();
  const { twin, setTwin } = useTwinState();

  const [history, setHistory] = useState<VersionHistoryItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineEventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rollbackSuccess, setRollbackSuccess] = useState<number | null>(null);
  
  // Version Comparison states
  const [compareVerA, setCompareVerA] = useState<string>("");
  const [compareVerB, setCompareVerB] = useState<string>("");
  const [comparisonReport, setComparisonReport] = useState<ComparisonReport | null>(null);

  // PDF Report states
  const [generatedReport, setGeneratedReport] = useState<TwinReportData | null>(null);

  useEffect(() => {
    if (twin?.id) {
      loadHistoryAndTimeline(twin.id);
    }
  }, [twin?.id, twin?.version]);

  const loadHistoryAndTimeline = async (twinId: string) => {
    setLoading(true);
    try {
      const hist = await TwinVersionService.getVersionHistory(twinId);
      const tl = await TwinTimelineService.getTimelineEvents(twinId);
      
      // Inject current active version as the latest in history for graph plotting
      const currentSnapshot: VersionHistoryItem = {
        version: twin?.version || 1,
        zones: twin?.zones || [],
        intelligence: twin?.intelligence || null,
        predictions: twin?.predictions || null,
        generatedBy: "Active Setup",
        reasonForUpdate: "Current Active Configuration",
        status: "active",
        timestamp: twin?.createdAt || new Date()
      };

      setHistory([currentSnapshot, ...hist]);
      setTimeline(tl);

      // Pre-set comparison selections
      if (hist.length > 0) {
        setCompareVerA(String(hist[hist.length - 1].version)); // Oldest
        setCompareVerB(String(currentSnapshot.version)); // Latest
      }
    } catch (err) {
      console.error("Failed to load history metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Restores a layout version
  const handleRollback = async (verItem: VersionHistoryItem) => {
    if (!twin || !twin.id) return;
    setLoading(true);
    setRollbackSuccess(null);
    try {
      const newVerNum = await TwinVersionService.restoreVersion(twin.id, verItem);
      
      // Update local state context
      setTwin({
        ...twin,
        zones: verItem.zones,
        intelligence: verItem.intelligence || undefined,
        predictions: verItem.predictions || undefined,
        version: newVerNum
      });
      
      setRollbackSuccess(verItem.version);
    } catch (err) {
      console.error("Rollback failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run Comparison Engine
  const handleCompare = () => {
    const itemA = history.find(h => String(h.version) === compareVerA);
    const itemB = history.find(h => String(h.version) === compareVerB);
    
    if (itemA && itemB) {
      const report = TwinComparisonService.compareVersions(itemA, itemB);
      setComparisonReport(report);
    }
  };

  // Compile Export Report
  const handleGenerateReport = () => {
    if (!twin) return;
    const rep = TwinReportService.generateReport(twin);
    setGeneratedReport(rep);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !twin) {
    return (
      <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-gray-400 space-y-3">
        <Activity className="animate-spin text-green-700 mx-auto" size={32} />
        <p className="text-sm font-semibold">Compiling lifecycle history timeline...</p>
      </div>
    );
  }

  // Pre-calculate data coordinates for SVG trend charts
  // Sort history ascending to draw left-to-right
  const sortedHistoryAsc = [...history].sort((a, b) => a.version - b.version);
  
  const getSvgLinePoints = (field: "healthScore" | "farmingEfficiency" | "totalCrops") => {
    const w = 420;
    const h = 100;
    const padding = 20;

    if (sortedHistoryAsc.length === 0) return "";
    
    return sortedHistoryAsc.map((hItem, idx) => {
      const x = padding + (idx / Math.max(1, sortedHistoryAsc.length - 1)) * (w - 2 * padding);
      
      let val = 0;
      if (field === "healthScore") {
        val = hItem.intelligence?.healthScore || 80;
      } else if (field === "farmingEfficiency") {
        val = hItem.intelligence?.farmingEfficiency || 75;
      } else {
        val = hItem.zones.filter(z => z.currentCrop && z.currentCrop !== "None").length * 10; // Normalized
      }

      // Map 0-100% to height h-padding to padding
      const y = h - padding - (val / 100) * (h - 2 * padding);
      return `${x},${y}`;
    }).join(" ");
  };

  const healthPoints = getSvgLinePoints("healthScore");
  const efficiencyPoints = getSvgLinePoints("farmingEfficiency");

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Rollback Notification Alert */}
      {rollbackSuccess !== null && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle size={16} />
          <span>Layout successfully rolled back to Version {rollbackSuccess}! Active replica version incremented.</span>
        </div>
      )}

      {/* 1. Progress Charts (Feature 6) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart: Health Score Trend */}
        <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-xs space-y-4">
          <div>
            <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">AI Health Score Progress</h4>
            <p className="text-[10px] text-gray-400">Score variations tracked across active history versions.</p>
          </div>
          
          <div className="relative border-b border-l border-slate-100 pb-2 pl-2">
            <svg viewBox="0 0 420 100" className="w-full overflow-visible">
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="400" y2="20" stroke="#f8fafc" strokeWidth="1" />
              <line x1="20" y1="50" x2="400" y2="50" stroke="#f8fafc" strokeWidth="1" />
              <line x1="20" y1="80" x2="400" y2="80" stroke="#f8fafc" strokeWidth="1" />

              {/* Line */}
              {healthPoints && (
                <polyline
                  fill="none"
                  stroke="#15803d"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  points={healthPoints}
                />
              )}

              {/* Version Dot Anchors */}
              {sortedHistoryAsc.map((hItem, idx) => {
                const padding = 20;
                const x = padding + (idx / Math.max(1, sortedHistoryAsc.length - 1)) * (420 - 2 * padding);
                const val = hItem.intelligence?.healthScore || 80;
                const y = 100 - padding - (val / 100) * (100 - 2 * padding);
                
                return (
                  <g key={idx} className="group">
                    <circle cx={x} cy={y} r="5" fill="#15803d" className="hover:scale-125 transition cursor-pointer" />
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-black fill-green-800 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      V{hItem.version} ({val}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Chart: Efficiency Score Trend */}
        <div className="bg-white border border-gray-150 p-5 rounded-3xl shadow-xs space-y-4">
          <div>
            <h4 className="font-extrabold text-gray-800 text-sm tracking-tight">Farming Efficiency Trend</h4>
            <p className="text-[10px] text-gray-400">Layout productivity scores calculated over configurations changes.</p>
          </div>

          <div className="relative border-b border-l border-slate-100 pb-2 pl-2">
            <svg viewBox="0 0 420 100" className="w-full overflow-visible">
              <line x1="20" y1="20" x2="400" y2="20" stroke="#f8fafc" strokeWidth="1" />
              <line x1="20" y1="50" x2="400" y2="50" stroke="#f8fafc" strokeWidth="1" />
              <line x1="20" y1="80" x2="400" y2="80" stroke="#f8fafc" strokeWidth="1" />

              {/* Line */}
              {efficiencyPoints && (
                <polyline
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  points={efficiencyPoints}
                />
              )}

              {/* Dots */}
              {sortedHistoryAsc.map((hItem, idx) => {
                const padding = 20;
                const x = padding + (idx / Math.max(1, sortedHistoryAsc.length - 1)) * (420 - 2 * padding);
                const val = hItem.intelligence?.farmingEfficiency || 75;
                const y = 100 - padding - (val / 100) * (100 - 2 * padding);

                return (
                  <g key={idx} className="group">
                    <circle cx={x} cy={y} r="5" fill="#2563eb" className="hover:scale-125 transition cursor-pointer" />
                    <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-black fill-blue-800 select-none opacity-0 group-hover:opacity-100 transition-opacity">
                      V{hItem.version} ({val}%)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

      </div>

      {/* 2. Version Comparison Workspace (Feature 3) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-6">
        <div className="border-b pb-4">
          <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5">
            <GitCompare className="text-green-700" size={20} />
            <span>Digital Twin Version Comparison</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Pick any two saved layout configurations to evaluate side-by-side differences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pickers */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase">Baseline Version A</label>
              <select
                value={compareVerA}
                onChange={(e) => setCompareVerA(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {history.map((h) => (
                  <option key={h.version} value={h.version}>
                    Version {h.version} ({h.reasonForUpdate.slice(0, 25)}...)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase">Comparison Version B</label>
              <select
                value={compareVerB}
                onChange={(e) => setCompareVerB(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                {history.map((h) => (
                  <option key={h.version} value={h.version}>
                    Version {h.version} ({h.reasonForUpdate.slice(0, 25)}...)
                  </option>
                ))}
              </select>
            </div>

            <Button
              onClick={handleCompare}
              className="w-full rounded-xl py-3 bg-green-700 hover:bg-green-800 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Compare Configurations</span>
            </Button>
          </div>

          {/* Results Comparison Grid */}
          <div className="lg:col-span-2 space-y-4">
            {comparisonReport ? (
              <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300 text-xs font-semibold">
                
                {/* Score differences */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  
                  {/* Health diff */}
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-[9px] text-gray-400 block uppercase">Health Shift</span>
                    <span className={`text-base font-black block mt-1 ${
                      comparisonReport.healthScoreDiff >= 0 ? "text-green-700" : "text-red-500"
                    }`}>
                      {comparisonReport.healthScoreDiff >= 0 ? `+${comparisonReport.healthScoreDiff}` : comparisonReport.healthScoreDiff}%
                    </span>
                  </div>

                  {/* Efficiency diff */}
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-[9px] text-gray-400 block uppercase">Efficiency Shift</span>
                    <span className={`text-base font-black block mt-1 ${
                      comparisonReport.efficiencyDiff >= 0 ? "text-green-700" : "text-red-500"
                    }`}>
                      {comparisonReport.efficiencyDiff >= 0 ? `+${comparisonReport.efficiencyDiff}` : comparisonReport.efficiencyDiff}%
                    </span>
                  </div>

                  {/* Sustainability diff */}
                  <div className="bg-white border rounded-xl p-3">
                    <span className="text-[9px] text-gray-400 block uppercase">Sustainability Shift</span>
                    <span className={`text-base font-black block mt-1 ${
                      comparisonReport.sustainabilityDiff >= 0 ? "text-green-700" : "text-red-500"
                    }`}>
                      {comparisonReport.sustainabilityDiff >= 0 ? `+${comparisonReport.sustainabilityDiff}` : comparisonReport.sustainabilityDiff}%
                    </span>
                  </div>

                </div>

                {/* Audit diff lists */}
                <div className="space-y-3.5 pt-2">
                  
                  {/* Added zones */}
                  {comparisonReport.addedZones.length > 0 && (
                    <div>
                      <span className="text-[9px] text-green-700 font-bold block uppercase tracking-wider mb-1">✓ Added Zones</span>
                      <ul className="space-y-1 list-inside list-disc text-gray-650">
                        {comparisonReport.addedZones.map((z, i) => <li key={i}>{z}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Removed zones */}
                  {comparisonReport.removedZones.length > 0 && (
                    <div>
                      <span className="text-[9px] text-red-500 font-bold block uppercase tracking-wider mb-1">✕ Removed Zones</span>
                      <ul className="space-y-1 list-inside list-disc text-gray-650">
                        {comparisonReport.removedZones.map((z, i) => <li key={i}>{z}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Crop Shifts */}
                  {comparisonReport.cropChanges.length > 0 ? (
                    <div>
                      <span className="text-[9px] text-blue-600 font-bold block uppercase tracking-wider mb-1">⚡ Layout Modifications</span>
                      <ul className="space-y-1 list-inside list-disc text-gray-650">
                        {comparisonReport.cropChanges.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-gray-450 italic text-[11px]">No crop variety or coordinate layout updates detected between selected versions.</div>
                  )}

                </div>

              </div>
            ) : (
              <div className="h-full min-h-[160px] rounded-2xl border border-dashed flex flex-col items-center justify-center text-center text-gray-450 p-6 space-y-2">
                <GitCompare size={24} className="text-gray-300" />
                <h5 className="font-extrabold text-sm text-gray-650">Comparison engine ready</h5>
                <p className="text-xs max-w-xs">
                  Select baseline and target versions from list to calculate layout audit modifications.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. Version History List (Feature 2) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-4">
        <h3 className="font-black text-gray-800 text-base border-b pb-3 flex items-center gap-1.5">
          <Clock className="text-green-700" size={18} />
          <span>Archived Versions Log</span>
        </h3>

        <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto pr-1">
          {history.map((ver, i) => (
            <div key={ver.id || i} className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between text-xs font-semibold">
              <div className="space-y-1.5 min-w-0">
                <div className="flex gap-2 items-center">
                  <span className="bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-md text-[10px] font-black">
                    Version {ver.version}
                  </span>
                  <span className="text-[10px] text-gray-405">
                    {ver.timestamp ? new Date(ver.timestamp.seconds * 1000).toLocaleString() : "Active Version"}
                  </span>
                  {ver.status === "active" && (
                    <span className="bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[9px] font-bold">Active</span>
                  )}
                </div>
                <p className="text-gray-700 truncate"><span className="font-bold text-gray-500">Reason:</span> {ver.reasonForUpdate}</p>
                <p className="text-[10px] text-gray-400">Generated By: {ver.generatedBy}</p>
              </div>

              {ver.status !== "active" && (
                <Button
                  onClick={() => handleRollback(ver)}
                  variant="outline"
                  className="rounded-xl px-4 py-2 border-gray-200 hover:bg-slate-50 text-[11px] font-black text-gray-700 shrink-0 select-none cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw size={12} className="text-green-700 animate-spin-hover" />
                  <span>Restore Configuration</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Timeline Events Chronological view (Feature 1) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-5">
        <h3 className="font-black text-gray-800 text-base border-b pb-3.5 flex items-center gap-1.5">
          <GitCommit className="text-green-700 animate-pulse" size={18} />
          <span>Terrace Timeline Event logs</span>
        </h3>

        <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6 text-xs font-semibold leading-normal">
          {timeline.map((ev, i) => (
            <div key={ev.id || i} className="relative space-y-1.5">
              {/* Event indicators */}
              <span className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                ev.eventType === "twin_created" ? "bg-green-600 ring-4 ring-green-100" :
                ev.eventType === "twin_updated" ? "bg-blue-600 ring-4 ring-blue-100" :
                ev.eventType === "crop_changed" ? "bg-emerald-500 ring-4 ring-emerald-100" :
                ev.eventType === "iot_alert" ? "bg-red-500 ring-4 ring-red-100 animate-pulse" :
                "bg-slate-400 ring-4 ring-slate-100"
              }`} />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">
                  {ev.timestamp ? new Date(ev.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                </span>
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[9px] font-bold sm:ml-2">
                  {ev.userAction}
                </span>
              </div>
              <p className="text-slate-800 font-bold leading-normal">{ev.description}</p>
            </div>
          ))}

          {/* Placeholders for future IoT Alerts or Agent automation decisions (Feature 10) */}
          <div className="relative space-y-1.5 opacity-55 border border-dashed border-gray-150 p-4.5 rounded-2xl bg-slate-50/50">
            <span className="absolute -left-[30px] top-4 w-2.5 h-2.5 rounded-full bg-gray-300 border-2 border-white" />
            <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400">
              <span>Future IoT Alerts Integration</span>
              <span>Hardware Link Placeholder</span>
            </div>
            <p className="text-gray-400 italic mt-1 leading-normal">
              Placeholders reserved for automated irrigation logs, soil moisture sensor alerts, ESP32 connection warnings, and AI Agent corrective adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* 5. PDF Audit Report compilation & Exports (Feature 7) */}
      <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-xs space-y-6">
        <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-gray-800 text-lg flex items-center gap-1.5">
              <FileText className="text-green-700" size={20} />
              <span>Professional Digital Twin Report Generator</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Export a complete terrace configurations list, diagnostic scores, and future predictions snapshot.
            </p>
          </div>
          <Button
            onClick={handleGenerateReport}
            className="rounded-xl px-5 py-3 bg-green-700 hover:bg-green-800 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Printer size={14} />
            <span>Compile Professional Report</span>
          </Button>
        </div>

        {/* Printable summary container */}
        {generatedReport && (
          <div className="border border-slate-200 p-8 rounded-2xl bg-slate-50/50 space-y-6 animate-in fade-in duration-300" id="print-area">
            <div className="flex justify-between items-start border-b pb-4 border-slate-200">
              <div>
                <h4 className="text-xl font-black text-slate-800">AGRITECH AI - TERRACE GARDEN AUDIT REPORT</h4>
                <p className="text-xs text-gray-400 mt-1">Generated At: {generatedReport.generatedAt} | Twin ID: {generatedReport.twinId}</p>
              </div>
              <span className="text-2xl shrink-0">🌿</span>
            </div>

            {/* Scores summary */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs font-semibold leading-normal">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-gray-450 block uppercase text-[9px]">Terrace Health</span>
                <span className="text-lg font-black text-green-700 block mt-1">{generatedReport.healthScore}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-gray-450 block uppercase text-[9px]">Farming Efficiency</span>
                <span className="text-lg font-black text-blue-600 block mt-1">{generatedReport.efficiencyScore}%</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <span className="text-gray-450 block uppercase text-[9px]">Sustainability</span>
                <span className="text-lg font-black text-amber-600 block mt-1">{generatedReport.sustainabilityScore}%</span>
              </div>
            </div>

            {/* Zones configurations details */}
            <div className="space-y-2.5">
              <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider block">Zone Details Summary ({generatedReport.totalZones} Zones, {generatedReport.totalCrops} Plant Varieties)</span>
              <div className="bg-white border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b font-extrabold text-slate-800">
                      <th className="p-3">Zone Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Crop</th>
                      <th className="p-3">Area (sq.ft)</th>
                      <th className="p-3 text-right">Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-gray-660">
                    {generatedReport.zonesList.map((z, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold text-slate-800">{z.name}</td>
                        <td className="p-3 capitalize">{z.type.replace("_", " ")}</td>
                        <td className="p-3 font-medium text-green-800">{z.crop}</td>
                        <td className="p-3">{z.area}</td>
                        <td className="p-3 text-right capitalize font-bold">{z.health}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action plan summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-semibold leading-normal">
              
              {/* Actions */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider">AI Priority Action Schedule</span>
                <ul className="space-y-1.5 list-inside list-disc text-gray-650 bg-white p-4 rounded-xl border">
                  {generatedReport.actions.map((act, i) => <li key={i}>{act}</li>)}
                </ul>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider">AI Optimizations & Care Plan</span>
                <ul className="space-y-1.5 list-inside list-disc text-gray-655 bg-white p-4 rounded-xl border">
                  {generatedReport.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                </ul>
              </div>

            </div>

            <Button
              onClick={handlePrint}
              className="rounded-xl px-5 py-2.5 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 ml-auto w-fit"
            >
              <FileDown size={14} />
              <span>Export PDF / Print Audit</span>
            </Button>

          </div>
        )}
      </div>

    </div>
  );
}
