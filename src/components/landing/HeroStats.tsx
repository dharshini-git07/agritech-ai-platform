"use client";

import { useLanguage } from "@/components/common/LanguageContext";

export default function HeroStats() {
  const { t } = useLanguage();

  const stats = [
    {
      number: "1000+",
      title: "farmers",
    },
    {
      number: "95%",
      title: "waterSaved",
    },
    {
      number: "24/7",
      title: "aiMonitoring",
    },
  ];

  return (
    <div className="flex flex-wrap gap-6 md:gap-12 mt-10">
      {stats.map((stat) => (
        <div key={stat.title}>
          <h2 className="text-3xl font-bold text-green-600">{stat.number}</h2>

          <p className="text-gray-500 text-sm font-medium">{t(stat.title as any)}</p>
        </div>
      ))}
    </div>
  );
}