"use client";

import { useLanguage } from "@/components/common/LanguageContext";

export default function HeroContent() {
  const { t } = useLanguage();

  return (
    <>
      <div className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-green-700 font-medium mb-6 text-sm">
        {t("landingBadge")}
      </div>

      <h1 className="text-6xl font-bold leading-tight">
        {t("landingTitle1")}
        <br />
        <span className="text-green-600">{t("landingTitle2")}</span>
      </h1>

      <p className="text-gray-600 mt-6 max-w-xl text-lg leading-relaxed">
        {t("landingDesc")}
      </p>
    </>
  );
}