"use client";

import FeatureCard from "./FeatureCard";
import { Sprout, Droplets, Wifi, ShoppingCart } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";

export default function Features() {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto py-24 px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold">{t("featuresTitle")}</h2>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">{t("featuresDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <FeatureCard
          icon={Sprout}
          title={t("featTerraceTitle")}
          description={t("featTerraceDesc")}
        />

        <FeatureCard
          icon={Droplets}
          title={t("featHydroTitle")}
          description={t("featHydroDesc")}
        />

        <FeatureCard
          icon={Wifi}
          title={t("featIotTitle")}
          description={t("featIotDesc")}
        />

        <FeatureCard
          icon={ShoppingCart}
          title={t("featMarketTitle")}
          description={t("featMarketDesc")}
        />
      </div>
    </section>
  );
}