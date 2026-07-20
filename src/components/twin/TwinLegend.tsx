"use client";

import React from "react";
import { useLanguage } from "@/components/common/LanguageContext";

export default function TwinLegend() {
  const { t } = useLanguage();

  const typeLegends = [
    { label: t("legendGrowBags") || "Grow Bags", colorBg: "bg-emerald-600", border: "border-emerald-500", desc: "Movable root vegetable grow beds" },
    { label: t("legendHydroponics") || "Hydroponics", colorBg: "bg-blue-600 animate-pulse", border: "border-blue-450", desc: "NFT channel system for leafy greens" },
    { label: t("legendWaterTank") || "Water Tank", colorBg: "bg-sky-500", border: "border-sky-400", desc: "Water source placement reservoir" },
    { label: t("legendCompost") || "Compost", colorBg: "bg-amber-800", border: "border-amber-700", desc: "Eco-compost conversion bin" },
    { label: t("legendWalkway") || "Walkway", colorBg: "bg-slate-700", border: "border-slate-600", desc: "Central access pathway" },
    { label: t("crop") || "Crop Zone", colorBg: "bg-green-700", border: "border-green-600", desc: "Traditional soil-based crop beds" }
  ];

  const sunlightLegends = [
    { label: t("legendSunlight") || "High Sunlight", colorBg: "bg-amber-50 text-amber-700", border: "border-amber-200", desc: "8+ Hours direct light" },
    { label: t("legendShade") || "Partial Shade", colorBg: "bg-orange-50 text-orange-700", border: "border-orange-200", desc: "4-6 Hours light" },
    { label: "Shade / Cover", colorBg: "bg-slate-50 text-slate-700", border: "border-slate-200", desc: "0-2 Hours light" }
  ];

  const statusLegends = [
    { label: t("healthHealthy") || "Healthy", colorBg: "bg-green-500", border: "border-green-400", desc: "Optimal conditions" },
    { label: t("healthAttention") || "Attention", colorBg: "bg-amber-500", border: "border-amber-400", desc: "Minor check required" },
    { label: t("healthCritical") || "Critical", colorBg: "bg-red-500", border: "border-red-400", desc: "Immediate action required" },
    { label: t("healthUnconfigured") || "Not Configured", colorBg: "bg-gray-400", border: "border-gray-300", desc: "Configuration pending" }
  ];

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Zone Types */}
      <div className="space-y-3">
        <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Zone Type Legends</h4>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {typeLegends.map((leg, idx) => (
            <div key={idx} className="flex gap-2.5 items-start text-xs border border-gray-100 p-3 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition select-none">
              <div className={`w-3.5 h-3.5 rounded-md border shrink-0 ${leg.colorBg} ${leg.border}`} />
              <div>
                <p className="font-extrabold text-gray-800 leading-none">{leg.label}</p>
                <p className="text-[9px] text-gray-400 mt-1 leading-tight">{leg.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sunlight and Health Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
        
        {/* Sunlight Map */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Sunlight Exposure Levels</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            {sunlightLegends.map((leg, idx) => (
              <div key={idx} className={`flex gap-2 items-start text-xs border p-3 rounded-2xl transition select-none ${leg.colorBg} ${leg.border}`}>
                <div>
                  <p className="font-extrabold leading-none">{leg.label}</p>
                  <p className="text-[9px] opacity-75 mt-1 leading-tight">{leg.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Status Map */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider">Zone Health Statuses</h4>
          <div className="grid sm:grid-cols-4 gap-3">
            {statusLegends.map((leg, idx) => (
              <div key={idx} className="flex gap-2 items-center text-xs border border-gray-100 p-2.5 rounded-xl bg-slate-50/35 select-none">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${leg.colorBg} ${leg.border}`} />
                <div>
                  <p className="font-extrabold text-gray-800 leading-none">{leg.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Future IoT Hardware Watermark info */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold bg-slate-50/50 p-3 rounded-2xl border border-gray-100/50 justify-center">
        <span>⚙️</span>
        <span>Future Hardware Integration Placeholders reserved for Sensor IDs, Pump Relays, and Solenoid Valves.</span>
      </div>

    </div>
  );
}
