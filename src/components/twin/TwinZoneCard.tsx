"use client";

import React from "react";
import { TwinZone } from "@/types/digitalTwin";
import { useLanguage } from "@/components/common/LanguageContext";
import { translations } from "@/lib/translations";

interface TwinZoneCardProps {
  zone: TwinZone;
  isActive: boolean;
  onSelect: () => void;
}

export default function TwinZoneCard({ zone, isActive, onSelect }: TwinZoneCardProps) {
  const { t } = useLanguage();

  // Status mapping to color dots
  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case "healthy":
        return { color: "bg-green-500", label: t("healthHealthy") || "Healthy" };
      case "attention":
        return { color: "bg-amber-500", label: t("healthAttention") || "Attention" };
      case "critical":
        return { color: "bg-red-500", label: t("healthCritical") || "Critical" };
      case "unconfigured":
      default:
        return { color: "bg-gray-400", label: t("healthUnconfigured") || "Not Configured" };
    }
  };

  const statusInfo = getStatusIndicator(zone.healthStatus);

  // Background style based on type
  const getZoneIcon = (type: string) => {
    switch (type) {
      case "water_tank":
        return "💧";
      case "compost":
        return "🍂";
      case "irrigation":
        return "⚙️";
      case "walkway":
        return "🚶";
      case "hydroponics":
        return "💧";
      case "grow_bags":
        return "🟢";
      case "crop":
      default:
        return "🌱";
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between ${
        isActive
          ? "border-green-600 bg-green-50/40 shadow-xs"
          : "border-gray-150 bg-white hover:border-gray-300 hover:shadow-xs"
      }`}
    >
      <div className="flex gap-3 items-center min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border shrink-0 ${
            isActive ? "bg-green-100/70 border-green-200" : "bg-gray-50 border-gray-100"
          }`}
        >
          {getZoneIcon(zone.zoneType)}
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-gray-800 text-sm truncate group-hover:text-green-700 transition-colors">
            {zone.zoneName}
          </p>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
            {t(zone.zoneType as keyof typeof translations.en) || zone.zoneType.replace("_", " ")}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
        {/* Health Indicator Dot */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color} shrink-0 animate-pulse`} />
          <span className="text-[10px] text-gray-500 font-bold">{statusInfo.label}</span>
        </div>
        <span className="text-[11px] font-extrabold text-green-700">
          {zone.currentCrop && zone.currentCrop !== "None" ? zone.currentCrop : t("notAvailable")}
        </span>
      </div>
    </div>
  );
}
