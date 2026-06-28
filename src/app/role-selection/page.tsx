import RoleCard from "@/components/auth/RoleCard";

import {
  Tractor,
  ShoppingCart,
  ShieldCheck,
} from "lucide-react";

export default function RoleSelection() {
  return (
    <main className="max-w-7xl mx-auto py-24 px-8">

      <div className="text-center mb-16">

        <h1 className="text-5xl font-bold">
          Choose Your Role
        </h1>

        <p className="text-gray-600 mt-4">
          Select how you want to access AgriTech AI.
        </p>

      </div>

      <div className="grid md:grid-cols-3 gap-10">

        <RoleCard
          icon={Tractor}
          title="Farmer"
          description="Manage AI farming, monitoring and marketplace."
          href="/login?role=farmer"
        />

        <RoleCard
          icon={ShoppingCart}
          title="Customer"
          description="Browse and purchase fresh farm products."
          href="/login?role=customer"
        />

        <RoleCard
          icon={ShieldCheck}
          title="Admin"
          description="Manage the complete AgriTech AI platform."
          href="/login?role=admin"
        />

      </div>

    </main>
  );
}