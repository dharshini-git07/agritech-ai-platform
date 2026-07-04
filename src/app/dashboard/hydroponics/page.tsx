"use client";

import { useLanguage } from "@/components/common/LanguageContext";
import { Droplets, Sparkles, Activity, ThermometerSun } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

export default function HydroponicsPage() {
  const { t } = useLanguage();

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold flex items-center gap-2">
          💧 {t("hydroponics")}
        </h1>
        <p className="text-gray-500 mt-2">
          Smart water-efficient farming dashboard. Monitor nutrient levels, flow rate, and pH balance.
        </p>
      </div>

      {/* Mock Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          title="pH Level"
          value="6.2"
          icon={Activity}
        />
        <StatCard
          title="Water Flow"
          value="1.8 L/min"
          icon={Droplets}
        />
        <StatCard
          title="Nutrient Temp"
          value="24°C"
          icon={ThermometerSun}
        />
      </div>

      <div className="bg-white rounded-3xl p-8 border border-gray-150 shadow-sm max-w-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-green-50 rounded-2xl text-green-700">
            <Sparkles size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">IoT Automation Coming Soon</h3>
            <p className="text-sm text-gray-500">Integrating smart sensors and automatic dosing pumps.</p>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed">
          The Hydroponics automation module will allow you to link physical water sensors, EC/pH probes, and solonoid valves to AgriTech AI. Our system will analyze nutrient consumption trends and recommend optimum dosing intervals based on crop type.
        </p>
      </div>
    </div>
  );
}
