"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sprout, Droplets } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";

export default function FarmingSection() {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto py-24 px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold">{t("farmingTitle")}</h2>

        <p className="text-gray-600 mt-4">{t("farmingDesc")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <Card className="rounded-3xl hover:shadow-xl transition-all">
          <CardContent className="p-10 text-center">
            <Sprout size={60} className="mx-auto text-green-600 mb-6" />

            <h3 className="text-2xl font-bold mb-4">{t("soilFarmingTitle")}</h3>

            <p className="text-gray-600">{t("soilFarmingDesc")}</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl hover:shadow-xl transition-all">
          <CardContent className="p-10 text-center">
            <Droplets size={60} className="mx-auto text-blue-500 mb-6" />

            <h3 className="text-2xl font-bold mb-4">{t("hydroponicsTitle")}</h3>

            <p className="text-gray-600">{t("hydroponicsDesc")}</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}