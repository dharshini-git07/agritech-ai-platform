"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 bg-green-700 text-white min-h-screen p-6">

      <h2 className="text-2xl font-bold mb-10">
        🌱 AgriTech AI
      </h2>

      <nav className="space-y-5">

        <Link href="/dashboard" className="block hover:text-green-200">
          Dashboard
        </Link>

        <Link
          href="/dashboard/terrace-planner"
          className="block hover:text-green-200"
        >
          🏠 Terrace Planner
        </Link>

        <Link
          href="/dashboard/crop-analysis"
          className="block hover:text-green-200"
        >
          🌱 Crop Health Analysis
        </Link>

        <Link
          href="/dashboard/history"
          className="block hover:text-green-200"
        >
          📜 Analysis History
        </Link>

        <Link
          href="/dashboard/hydroponics"
          className="block hover:text-green-200"
        >
          💧 Hydroponics
        </Link>

        <Link
          href="/marketplace"
          className="block hover:text-green-200"
        >
          🛒 Marketplace
        </Link>

      </nav>

    </aside>
  );
}