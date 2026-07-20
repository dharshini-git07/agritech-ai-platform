"use client";

import React from "react";
import { TwinZone } from "@/types/digitalTwin";
import { useTwinState } from "./TwinStateManager";

export default function TwinRenderer() {
  const { twin, activeZoneId, setActiveZoneId, searchQuery, filteredZones } = useTwinState();

  if (!twin) return null;

  const isQueryActive = searchQuery.trim().length > 0;
  const isMatching = (zoneId: string) => {
    return filteredZones.some((z) => z.zoneId === zoneId);
  };

  // Resolve fill styles (custom colors vs. default types)
  const getZoneFill = (zone: TwinZone) => {
    if (zone.color && zone.color.trim().startsWith("#")) {
      return {
        style: { fill: zone.color },
        className: "hover:opacity-85"
      };
    }

    switch (zone.zoneType) {
      case "water_tank":
        return { className: "fill-sky-500/80 stroke-sky-400 hover:fill-sky-400" };
      case "compost":
        return { className: "fill-amber-800/80 stroke-amber-700 hover:fill-amber-700" };
      case "irrigation":
        return { className: "fill-teal-600/80 stroke-teal-500 hover:fill-teal-500" };
      case "walkway":
        return { className: "fill-slate-700/60 stroke-slate-600 hover:fill-slate-650" };
      case "hydroponics":
        return { className: "fill-blue-600/90 stroke-blue-450 hover:fill-blue-500 animate-pulse" };
      case "grow_bags":
        return { className: "fill-emerald-600/80 stroke-emerald-500 hover:fill-emerald-500" };
      case "crop":
      default:
        return { className: "fill-green-700/80 stroke-green-600 hover:fill-green-600" };
    }
  };

  const renderZoneRectangle = (zone: TwinZone, rx: string, defaultStrokeWidth: string) => {
    const fillDetails = getZoneFill(zone);
    const active = activeZoneId === zone.zoneId;
    const match = isMatching(zone.zoneId);

    // Highlighting border calculation
    let strokeColor = "rgba(255, 255, 255, 0.2)";
    let strokeWidth = defaultStrokeWidth;

    if (active) {
      strokeColor = "#ffffff";
      strokeWidth = (parseFloat(defaultStrokeWidth) * 2.5).toString();
    } else if (isQueryActive && match) {
      strokeColor = "#22c55e";
      strokeWidth = (parseFloat(defaultStrokeWidth) * 1.8).toString();
    }

    const opacityClass = isQueryActive && !match ? "opacity-25" : "opacity-100";

    return (
      <rect
        key={zone.zoneId}
        x={zone.coordinates.x}
        y={zone.coordinates.y}
        width={zone.coordinates.w}
        height={zone.coordinates.h}
        onClick={() => setActiveZoneId(zone.zoneId)}
        className={`transition-all duration-200 cursor-pointer ${fillDetails.className || ""} ${opacityClass}`}
        style={fillDetails.style}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        rx={rx}
      />
    );
  };

  return (
    <div className="relative w-full aspect-square md:aspect-video bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col justify-between items-center select-none">
      
      {/* Blueprint Grid Watermark Layer */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="relative w-full h-full flex items-center justify-center">
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full max-h-[480px] drop-shadow-xl"
        >
          {/* Outer Terrace Boundary dotted outline */}
          <rect 
            x="1" 
            y="1" 
            width="98" 
            height="98" 
            fill="none" 
            stroke="#22c55e" 
            strokeWidth="0.8" 
            strokeDasharray="2,2" 
            rx="4" 
            className="opacity-40" 
          />

          {/* Render walkways in background layer */}
          {twin.zones.filter(z => z.zoneType === "walkway").map(zone => 
            renderZoneRectangle(zone, "1.5", "0.4")
          )}

          {/* Render static utilities (tank, compost, pumps) */}
          {twin.zones.filter(z => ["water_tank", "compost", "irrigation"].includes(z.zoneType)).map(zone => 
            renderZoneRectangle(zone, "2.5", "0.4")
          )}

          {/* Render vegetation crop beds and hydroponic bays */}
          {twin.zones.filter(z => ["crop", "hydroponics", "grow_bags"].includes(z.zoneType)).map(zone => 
            renderZoneRectangle(zone, "3", "0.5")
          )}

          {/* Text labels overlays */}
          {twin.zones.map(zone => {
            let label = "";
            switch (zone.zoneType) {
              case "water_tank":
                label = "💧 Tank";
                break;
              case "compost":
                label = "🍂 Compost";
                break;
              case "irrigation":
                label = "⚙️ Pump";
                break;
              case "walkway":
                label = "Walkway";
                break;
              case "hydroponics":
                label = "💧 Hydro";
                break;
              case "grow_bags":
                label = "🟢 Bags";
                break;
              default:
                // Show current crop if assigned, otherwise show recommended crop
                label = zone.currentCrop && zone.currentCrop !== "None" 
                  ? `🌱 ${zone.currentCrop}`
                  : `🌱 ${zone.recommendedCrop}`;
            }

            const match = isMatching(zone.zoneId);
            const opacityClass = isQueryActive && !match ? "opacity-25" : "opacity-100";

            return (
              <g key={`lbl-${zone.zoneId}`} className={`pointer-events-none transition-all duration-200 ${opacityClass}`}>
                {/* Text overlay shadow */}
                <text
                  x={zone.coordinates.x + zone.coordinates.w / 2}
                  y={zone.coordinates.y + zone.coordinates.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-slate-950 font-black text-[3.2px] select-none uppercase tracking-wider opacity-60"
                  style={{ transform: "translateY(0.4px)" }}
                >
                  {label}
                </text>
                <text
                  x={zone.coordinates.x + zone.coordinates.w / 2}
                  y={zone.coordinates.y + zone.coordinates.h / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-white font-black text-[3px] select-none uppercase tracking-wider"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* SVG overlay HUD coordinates guide */}
      <div className="w-full flex justify-between items-center text-[10px] font-mono text-green-500/70 border-t border-slate-900 pt-3">
        <span>GRID: 100 x 100 MAPPED</span>
        <span className="animate-pulse">● LIVE TWIN REPLICA</span>
      </div>
    </div>
  );
}
