"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/common/LanguageContext";

export default function QuickActions() {
  const { t } = useLanguage();

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">{t("quickActions")}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/crop-analysis">
          <Button className="w-full">🌱 {t("cropAnalysis")}</Button>
        </Link>

        <Link href="/dashboard/hydroponics">
          <Button className="w-full">💧 {t("hydroponics")}</Button>
        </Link>

        <Link href="/marketplace">
          <Button className="w-full">🛒 {t("marketplace")}</Button>
        </Link>

        <Link href="/dashboard/reports">
          <Button className="w-full">📊 {t("reports")}</Button>
        </Link>
      </div>
    </div>
  );
}