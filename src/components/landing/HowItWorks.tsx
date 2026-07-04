"use client";

import StepCard from "./StepCard";
import { Upload, ScanSearch, Sprout, Leaf } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";

export default function HowItWorks() {
  const { t } = useLanguage();

  return (
    <section className="max-w-7xl mx-auto py-24 px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold">{t("howItWorksTitle")}</h2>

        <p className="text-gray-600 mt-4">{t("howItWorksDesc")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StepCard
          step="01"
          icon={Upload}
          title={t("step1Title")}
          description={t("step1Desc")}
        />

        <StepCard
          step="02"
          icon={ScanSearch}
          title={t("step2Title")}
          description={t("step2Desc")}
        />

        <StepCard
          step="03"
          icon={Sprout}
          title={t("step3Title")}
          description={t("step3Desc")}
        />

        <StepCard
          step="04"
          icon={Leaf}
          title={t("step4Title")}
          description={t("step4Desc")}
        />
      </div>
    </section>
  );
}