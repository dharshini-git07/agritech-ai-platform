"use client";

import React, { useState, useEffect } from "react";
import { useTwinState } from "./TwinStateManager";
import { useLanguage } from "@/components/common/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Info, 
  Sun, 
  Droplet, 
  Wrench, 
  Cpu, 
  Thermometer, 
  CloudRain, 
  Power,
  Edit2,
  Save,
  X,
  FileText,
  AlertTriangle,
  Grid,
  CheckCircle,
  HelpCircle,
  Eye,
  Settings,
  BrainCircuit
} from "lucide-react";
import { TwinAnalysisEngine } from "@/services/twinAnalysisEngine";

export default function TwinSidebar() {
  const { t } = useLanguage();
  const { 
    activeZone, 
    isEditing, 
    setIsEditing, 
    editZoneData, 
    setEditZoneData, 
    saveZoneChanges, 
    cancelEdit,
    isSaving,
    errorMessage
  } = useTwinState();

  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<boolean>(false);

  // Sync / clear message triggers
  useEffect(() => {
    setLocalError(errorMessage);
  }, [errorMessage]);

  useEffect(() => {
    if (localSuccess) {
      const timer = setTimeout(() => setLocalSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [localSuccess]);

  if (!activeZone) {
    return (
      <div className="bg-white border border-gray-150 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-gray-400 space-y-4 h-full min-h-[400px]">
        <Info size={40} className="text-gray-300 animate-bounce" />
        <h4 className="font-bold text-gray-700 text-lg">{t("noZoneSelected") || "No Zone Selected"}</h4>
        <p className="text-sm max-w-xs leading-relaxed">
          Click any highlighted zone on the 2D layout map or search list to inspect diagnostics, crop details, and IoT configurations.
        </p>
      </div>
    );
  }

  // Pre-calculate values if not stored in Firestore
  const calculatedArea = activeZone.area || Math.round(activeZone.coordinates.w * activeZone.coordinates.h * 0.1);
  
  const getSunlightHours = (sunlight: string) => {
    if (activeZone.sunlightHours) return activeZone.sunlightHours;
    switch (sunlight) {
      case "high": return 8;
      case "partial": return 5;
      case "shade":
      default: return 2;
    }
  };

  const sunlightHours = getSunlightHours(activeZone.sunlight);

  // Sunlight styling classes
  const getSunlightBadge = (level: string) => {
    switch (level) {
      case "high":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "partial":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Health Status Info helper
  const getHealthStatusInfo = (status?: string) => {
    switch (status) {
      case "healthy":
        return { color: "bg-green-500", text: t("healthHealthy") || "Healthy", border: "border-green-200", bg: "bg-green-50/50" };
      case "attention":
        return { color: "bg-amber-500", text: t("healthAttention") || "Attention", border: "border-amber-200", bg: "bg-amber-50/50" };
      case "critical":
        return { color: "bg-red-500", text: t("healthCritical") || "Critical", border: "border-red-200", bg: "bg-red-50/50" };
      case "unconfigured":
      default:
        return { color: "bg-gray-400", text: t("healthUnconfigured") || "Not Configured", border: "border-gray-200", bg: "bg-gray-50/50" };
    }
  };

  const healthInfo = getHealthStatusInfo(activeZone.healthStatus);
  const zoneSuitability = TwinAnalysisEngine.evaluateZoneSuitability(activeZone);

  // Color preset buttons
  const colorPresets = [
    { label: "Default", hex: "" },
    { label: "Green", hex: "#15803d" },
    { label: "Emerald", hex: "#059669" },
    { label: "Teal", hex: "#0d9488" },
    { label: "Blue", hex: "#2563eb" },
    { label: "Sky", hex: "#0ea5e9" },
    { label: "Amber", hex: "#d97706" },
    { label: "Red", hex: "#dc2626" },
    { label: "Slate", hex: "#475569" },
  ];

  // Save changes wrapper
  const handleSave = async () => {
    if (!editZoneData) return;
    if (!editZoneData.zoneName.trim()) {
      setLocalError("Zone Name is required.");
      return;
    }
    const success = await saveZoneChanges();
    if (success) {
      setLocalSuccess(true);
      setLocalError(null);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6 h-full flex flex-col justify-between transition-all duration-300">
      
      {/* Scrollable Container */}
      <div className="space-y-6 overflow-y-auto max-h-[620px] pr-1 scrollbar-thin">
        
        {/* Header Block */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 w-fit ${healthInfo.bg} ${healthInfo.border} text-gray-700`}>
              <span className={`w-2 h-2 rounded-full ${healthInfo.color} animate-pulse`} />
              <span>{healthInfo.text}</span>
            </span>
            {isEditing ? (
              <div className="mt-2 space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t("zoneName") || "Zone Name"}</label>
                <input
                  type="text"
                  value={editZoneData?.zoneName || ""}
                  onChange={(e) => setEditZoneData(prev => prev ? { ...prev, zoneName: e.target.value } : null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500"
                  placeholder="Zone Name"
                />
              </div>
            ) : (
              <h3 className="text-2xl font-black text-gray-800 mt-2">{activeZone.zoneName}</h3>
            )}
          </div>
          <span className="text-[10px] font-mono font-bold bg-gray-105 border border-gray-200 px-2.5 py-1 rounded-lg text-gray-450 shrink-0 select-none">
            ID: {activeZone.zoneId}
          </span>
        </div>

        {/* General Meta Row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">{t("zoneType") || "Type"}</span>
            <span className="text-xs font-bold text-slate-800 capitalize truncate block">
              {t(activeZone.zoneType as any) || activeZone.zoneType.replace("_", " ")}
            </span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">{t("area") || "Area"}</span>
            <span className="text-xs font-bold text-slate-800 block">{calculatedArea} sq. ft</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl">
            <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider block">{t("currentStatus") || "Status"}</span>
            <span className="text-xs font-bold text-slate-800 capitalize block">{activeZone.status}</span>
          </div>
        </div>

        {/* EDITING FORM BODY */}
        {isEditing && editZoneData ? (
          <div className="space-y-4 pt-2 border-t border-gray-100">
            
            {/* Status Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">Health Status</label>
              <select
                value={editZoneData.healthStatus || "unconfigured"}
                onChange={(e) => setEditZoneData(prev => prev ? { ...prev, healthStatus: e.target.value as any } : null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500 cursor-pointer"
              >
                <option value="healthy">🟢 {t("healthHealthy") || "Healthy"}</option>
                <option value="attention">🟡 {t("healthAttention") || "Attention"}</option>
                <option value="critical">🔴 {t("healthCritical") || "Critical"}</option>
                <option value="unconfigured">⚪ {t("healthUnconfigured") || "Not Configured"}</option>
              </select>
            </div>

            {/* Current Crop Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t("currentCrop") || "Current Crop"}</label>
              <input
                type="text"
                value={editZoneData.currentCrop || ""}
                onChange={(e) => setEditZoneData(prev => prev ? { ...prev, currentCrop: e.target.value } : null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-green-500"
                placeholder="e.g. Tomato, Spinach, None"
              />
            </div>

            {/* Color Customizer */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{t("zoneColor") || "Zone Layout Color"}</label>
              <div className="grid grid-cols-5 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setEditZoneData(prev => prev ? { ...prev, color: preset.hex } : null)}
                    className={`h-8 rounded-lg text-[10px] font-bold border transition flex items-center justify-center shrink-0 ${
                      (editZoneData.color || "") === preset.hex
                        ? "border-green-600 ring-2 ring-green-100 bg-green-50"
                        : "border-gray-200 hover:bg-gray-50 bg-white"
                    }`}
                    style={preset.hex ? { backgroundColor: `${preset.hex}15`, color: preset.hex, borderColor: preset.hex } : {}}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t("addNotes") || "User Notes"}</label>
              <textarea
                value={editZoneData.notes || ""}
                onChange={(e) => setEditZoneData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-green-500 min-h-[70px] resize-none"
                placeholder="Enter custom zone notes or layout observations..."
              />
            </div>

            {/* Future IoT Hardware configuration in Edit Mode */}
            <div className="space-y-2 border-t border-gray-100 pt-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Configure IoT Identifiers</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-400 font-bold block">{t("sensorId") || "Sensor ID"}</span>
                  <input
                    type="text"
                    value={editZoneData.futureSensorId || ""}
                    onChange={(e) => setEditZoneData(prev => prev ? { ...prev, futureSensorId: e.target.value } : null)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-400 font-bold block">{t("pumpId") || "Pump ID"}</span>
                  <input
                    type="text"
                    value={editZoneData.pumpId || ""}
                    onChange={(e) => setEditZoneData(prev => prev ? { ...prev, pumpId: e.target.value } : null)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-400 font-bold block">{t("valveId") || "Valve ID"}</span>
                  <input
                    type="text"
                    value={editZoneData.valveId || ""}
                    onChange={(e) => setEditZoneData(prev => prev ? { ...prev, valveId: e.target.value } : null)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-400 font-bold block">{t("cameraId") || "Camera ID"}</span>
                  <input
                    type="text"
                    value={editZoneData.cameraId || ""}
                    onChange={(e) => setEditZoneData(prev => prev ? { ...prev, cameraId: e.target.value } : null)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* READ ONLY INFO PANEL */
          <div className="space-y-6 pt-2 border-t border-gray-100">
            
            {/* Crop Allocation Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50/40 border border-green-100 p-4 rounded-2xl flex items-center justify-between col-span-2">
                <div>
                  <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider">{t("currentCrop") || "Current Crop"}</span>
                  <span className="text-base font-extrabold text-green-800">
                    {activeZone.currentCrop && activeZone.currentCrop !== "None" ? activeZone.currentCrop : t("notAvailable")}
                  </span>
                </div>
                <span className="text-2xl">🌱</span>
              </div>

              {activeZone.recommendedCrop !== "None" && (
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between col-span-2">
                  <div>
                    <span className="text-[9px] text-gray-400 font-black block uppercase tracking-wider">{t("recommendedCrop") || "Recommended Crop"}</span>
                    <span className="text-sm font-extrabold text-gray-700">{activeZone.recommendedCrop}</span>
                  </div>
                  <span className="text-xl">💡</span>
                </div>
              )}
            </div>

            {/* Environmental Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`border p-3.5 rounded-2xl flex flex-col gap-1.5 ${getSunlightBadge(activeZone.sunlight)}`}>
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide">
                  <Sun size={12} />
                  <span>{t("sunlightLabel") || "Sunlight"}</span>
                </div>
                <span className="text-xs font-black capitalize">
                  {sunlightHours} Hrs ({activeZone.sunlight})
                </span>
              </div>

              <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3.5 rounded-2xl flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide">
                  <Droplet size={12} />
                  <span>{t("waterRequirement") || "Watering"}</span>
                </div>
                <span className="text-xs font-black capitalize">
                  {activeZone.wateringRequirement} Required
                </span>
              </div>
            </div>

            {/* AI Zone Analysis Panel (Feature 2) */}
            <div className="bg-slate-50/70 border border-slate-200 p-4.5 rounded-2xl space-y-3.5">
              <div className="flex items-center gap-1.5 border-b pb-2 border-slate-100">
                <BrainCircuit className="text-green-700 animate-pulse" size={16} />
                <span className="font-extrabold text-[10px] text-slate-800 uppercase tracking-wide">
                  {t("zoneAnalysisTitle") || "AI Zone Analysis Panel"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5 text-[11px] font-semibold">
                {/* Sunlight Suitability */}
                <div className="space-y-0.5">
                  <span className="text-gray-400 block text-[9px] font-extrabold uppercase">Sunlight Match</span>
                  <span className={`font-black capitalize flex items-center gap-1 ${
                    zoneSuitability.sunlightSuitability === "high" ? "text-green-700" :
                    zoneSuitability.sunlightSuitability === "medium" ? "text-amber-500" : "text-red-500 animate-pulse"
                  }`}>
                    {zoneSuitability.sunlightSuitability === "low" && "⚠️ "}
                    {zoneSuitability.sunlightSuitability}
                  </span>
                </div>

                {/* Crop Suitability */}
                <div className="space-y-0.5">
                  <span className="text-gray-400 block text-[9px] font-extrabold uppercase">Crop Match</span>
                  <span className={`font-black capitalize flex items-center gap-1 ${
                    zoneSuitability.cropSuitability === "excellent" ? "text-green-700" :
                    zoneSuitability.cropSuitability === "good" ? "text-amber-500" : "text-red-500 animate-pulse"
                  }`}>
                    {zoneSuitability.cropSuitability === "poor" && "⚠️ "}
                    {zoneSuitability.cropSuitability}
                  </span>
                </div>

                {/* Zone Health */}
                <div className="space-y-0.5">
                  <span className="text-gray-400 block text-[9px] font-extrabold uppercase">Zone Health</span>
                  <span className={`font-black capitalize flex items-center gap-1 ${
                    zoneSuitability.health === "healthy" ? "text-green-700" :
                    zoneSuitability.health === "attention" ? "text-amber-500" : "text-red-500 animate-pulse"
                  }`}>
                    {zoneSuitability.health}
                  </span>
                </div>

                {/* Maintenance Status */}
                <div className="space-y-0.5">
                  <span className="text-gray-400 block text-[9px] font-extrabold uppercase">Status</span>
                  <span className="font-extrabold text-slate-700 capitalize">
                    {zoneSuitability.maintenance}
                  </span>
                </div>
              </div>

              {/* Attention Warning Alert if Sunlight or Crop Suitability is Low/Poor */}
              {(zoneSuitability.sunlightSuitability === "low" || zoneSuitability.cropSuitability === "poor" || zoneSuitability.health === "critical") && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-[10px] font-bold flex gap-1.5 items-start mt-2">
                  <span>⚠️</span>
                  <span>This zone requires attention: Layout parameters are sub-optimal for current crops.</span>
                </div>
              )}
            </div>

            {/* Care instructions / AI Care */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Wrench size={12} />
                <span>{t("aiRecommendation") || "AI Care Recommendation"}</span>
              </label>
              <p className="text-xs text-gray-650 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                {activeZone.maintenanceNotes}
              </p>
            </div>

            {/* Custom Notes Display */}
            {activeZone.notes && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <FileText size={12} />
                  <span>User Notes</span>
                </label>
                <p className="text-xs text-gray-600 italic bg-amber-50/20 p-3.5 rounded-2xl border border-amber-100/50 leading-relaxed">
                  "{activeZone.notes}"
                </p>
              </div>
            )}

            {/* Future IoT Hardware Diagnostics */}
            <div className="border-t border-gray-100 pt-5 space-y-4">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                <Cpu className="text-green-700" size={16} />
                <span>{t("futureHardwarePlaceholder") || "IoT Diagnostic Readings"}</span>
              </h4>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                {/* Status sensor link */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-gray-400 font-semibold flex items-center gap-1">
                    <Cpu size={12} /> ESP32 Link:
                  </span>
                  <span className="font-bold text-red-500">Offline</span>
                </div>

                {/* Moisture sensor */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-gray-400 font-semibold flex items-center gap-1">
                    <Droplet size={12} /> Moisture:
                  </span>
                  <span className="font-mono text-gray-400 font-bold">{activeZone.sensors.soilMoisture || "N/A"}</span>
                </div>

                {/* Temp */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-gray-400 font-semibold flex items-center gap-1">
                    <Thermometer size={12} /> Temp:
                  </span>
                  <span className="font-mono text-gray-400 font-bold">{activeZone.sensors.temperature || "N/A"}</span>
                </div>

                {/* Humidity */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-gray-400 font-semibold flex items-center gap-1">
                    <CloudRain size={12} /> Humidity:
                  </span>
                  <span className="font-mono text-gray-400 font-bold">{activeZone.sensors.humidity || "N/A"}</span>
                </div>

                {/* Water Tank */}
                {activeZone.zoneType === "water_tank" && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <Droplet size={12} className="text-sky-500" /> Tank Water Level:
                    </span>
                    <span className="font-bold text-sky-600 font-mono">{activeZone.sensors.waterLevel || "N/A"}</span>
                  </div>
                )}

                {/* Drip Pump switch status */}
                {activeZone.zoneType === "irrigation" && (
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                    <span className="text-gray-400 font-semibold flex items-center gap-1">
                      <Power size={12} className="text-teal-600" /> Pump Status:
                    </span>
                    <span className="font-bold text-gray-400 font-mono">CLOSED (Off)</span>
                  </div>
                )}

                {/* Placeholders display */}
                <div className="col-span-2 border-t border-dashed border-gray-100 pt-3 mt-1 space-y-1.5 text-[11px] text-gray-400">
                  <p className="flex justify-between">
                    <span>{t("sensorId") || "Sensor ID"}:</span>
                    <span className="font-mono font-semibold text-gray-600">{activeZone.futureSensorId || "None"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{t("pumpId") || "Pump ID"}:</span>
                    <span className="font-mono font-semibold text-gray-600">{activeZone.pumpId || "None"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{t("valveId") || "Valve ID"}:</span>
                    <span className="font-mono font-semibold text-gray-600">{activeZone.valveId || "None"}</span>
                  </p>
                  <p className="flex justify-between">
                    <span>{t("cameraId") || "Camera ID"}:</span>
                    <span className="font-mono font-semibold text-gray-600">{activeZone.cameraId || "None"}</span>
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>

      {/* FOOTER ACTIONS PANEL */}
      <div className="border-t border-gray-100 pt-4 mt-4">
        {localError && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="font-semibold">{localError}</span>
          </div>
        )}

        {localSuccess && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle size={14} className="shrink-0" />
            <span className="font-semibold">{t("saveSuccess") || "Zone changes saved successfully!"}</span>
          </div>
        )}

        {isEditing ? (
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={cancelEdit}
              disabled={isSaving}
              className="rounded-xl font-bold text-xs py-3 border-gray-250 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X size={14} />
              <span>Cancel</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl font-bold text-xs py-3 bg-green-700 text-white hover:bg-green-800 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              <span>{isSaving ? (t("savingText") || "Saving...") : (t("saveChanges") || "Save")}</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="w-full rounded-xl font-bold text-xs py-3.5 bg-green-700 text-white hover:bg-green-800 cursor-pointer flex items-center justify-center gap-2"
          >
            <Edit2 size={14} />
            <span>{t("editMode") || "Edit Zone Settings"}</span>
          </Button>
        )}
      </div>

    </div>
  );
}
