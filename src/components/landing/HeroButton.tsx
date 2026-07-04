"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/common/LanguageContext";
import Link from "next/link";

export default function HeroButton() {
  const { t } = useLanguage();

  return (
    <div className="flex gap-4 mt-8">
      <Link href="/role-selection">
        <Button size="lg">{t("getStarted")}</Button>
      </Link>

      <Link href="/role-selection">
        <Button variant="outline" size="lg">
          {t("analyzeTerrace")}
        </Button>
      </Link>
    </div>
  );
}
