"use client";

import RoleCard from "@/components/auth/RoleCard";
import { useLanguage } from "@/components/common/LanguageContext";
import { Tractor, ShoppingCart, ShieldCheck } from "lucide-react";

export default function RoleSelection() {
  const { t } = useLanguage();

  return (
    <main className="max-w-7xl mx-auto py-24 px-8">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold">{t("chooseRoleTitle")}</h1>

        <p className="text-gray-600 mt-4">{t("chooseRoleDesc")}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-10">
        <RoleCard
          icon={Tractor}
          title="farmerRoleTitle"
          description="farmerRoleDesc"
          href="/login?role=farmer"
        />

        <RoleCard
          icon={ShoppingCart}
          title="customerRoleTitle"
          description="customerRoleDesc"
          href="/login?role=customer"
        />

        <RoleCard
          icon={ShieldCheck}
          title="adminRoleTitle"
          description="adminRoleDesc"
          href="/login?role=admin"
        />
      </div>
    </main>
  );
}