"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-green-700 text-white min-h-screen p-6">

      <h2 className="text-2xl font-bold mb-10">
        🌱 AgriTech AI
      </h2>

      <nav className="space-y-4">

        <Link href="/dashboard" className="block hover:text-green-200">
          Dashboard
        </Link>

        <Link href="/dashboard/terrace" className="block hover:text-green-200">
          Terrace Analysis
        </Link>

        <Link href="/dashboard/recommendation" className="block hover:text-green-200">
          AI Recommendation
        </Link>

        <Link href="/dashboard/hydroponics" className="block hover:text-green-200">
          Hydroponics
        </Link>

        <Link href="/marketplace" className="block hover:text-green-200">
          Marketplace
        </Link>

      </nav>

    </aside>
  );
}