"use client";

import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";

export default function Marketplace() {
  const { t } = useLanguage();

  return (
    <section className="bg-green-600 text-white py-24">
      <div className="max-w-6xl mx-auto text-center px-8">
        <ShoppingBasket size={60} className="mx-auto mb-6" />

        <h2 className="text-5xl font-bold">{t("marketSectionTitle")}</h2>

        <p className="mt-6 text-lg opacity-90 max-w-2xl mx-auto">
          {t("marketSectionDesc")}
        </p>

        <Button className="mt-10 bg-white text-green-700 hover:bg-gray-100">
          {t("exploreMarketplaceButton")}
        </Button>
      </div>
    </section>
  );
}