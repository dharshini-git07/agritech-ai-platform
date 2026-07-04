"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bot, BrainCircuit, Camera, MessageSquare } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";

export default function AISection() {
  const { t } = useLanguage();

  return (
    <section className="bg-green-50 py-24 px-8">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        {/* Left Side */}
        <div>
          <span className="bg-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            {t("aiSectionBadge")}
          </span>

          <h2 className="text-5xl font-bold mt-6">
            {t("aiSectionTitlePre")}
            <span className="text-green-600">{t("aiSectionTitleSuf")}</span>
          </h2>

          <p className="text-gray-600 mt-6 text-lg leading-8">{t("aiSectionDesc")}</p>
        </div>

        {/* Right Side */}
        <Card className="rounded-3xl shadow-xl">
          <CardContent className="p-10 space-y-6">
            <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
              <Bot className="text-green-600" />
              {t("aiSectionFeature1")}
            </div>

            <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
              <Camera className="text-green-600" />
              {t("aiSectionFeature2")}
            </div>

            <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
              <BrainCircuit className="text-green-600" />
              {t("aiSectionFeature3")}
            </div>

            <div className="flex items-center gap-4 text-sm font-semibold text-gray-700">
              <MessageSquare className="text-green-600" />
              {t("aiSectionFeature4")}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}