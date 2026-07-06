"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage, Language } from "@/components/common/LanguageContext";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b bg-white">
      <h1 className="text-2xl font-bold text-green-600">🌱 AgriTech AI</h1>

      <div className="hidden md:flex gap-8 items-center text-sm font-medium text-gray-600">
        <Link href="/" className="hover:text-green-600 transition">
          {t("home")}
        </Link>
        <Link href="/" className="hover:text-green-600 transition">
          {t("features")}
        </Link>
        <Link href="/" className="hover:text-green-600 transition">
          {t("howItWorks")}
        </Link>
        <Link href="/" className="hover:text-green-600 transition">
          {t("marketplace")}
        </Link>
        <Link href="/" className="hover:text-green-600 transition">
          {t("about")}
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        {/* Public Language Selector */}
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-green-400 cursor-pointer mr-2"
        >
          <option value="en">English</option>
          <option value="ta">தமிழ்</option>
          <option value="hi">हिन्दी</option>
        </select>

        <Link href="/role-selection">
          <Button variant="outline">{t("login")}</Button>
        </Link>

        <Link href="/role-selection" className="hidden sm:inline-block">
          <Button>{t("getStarted")}</Button>
        </Link>
      </div>
    </nav>
  );
}