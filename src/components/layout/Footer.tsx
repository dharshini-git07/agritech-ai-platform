"use client";

import Link from "next/link";
import { useLanguage } from "@/components/common/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-10">
        <div>
          <h2 className="text-2xl font-bold text-white">🌱 AgriTech AI</h2>

          <p className="mt-4">{t("footerDesc")}</p>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">{t("quickLinksLabel")}</h3>

          <div className="space-y-2 text-sm">
            <Link href="/" className="hover:text-white transition">
              {t("home")}
            </Link>
            <br />
            <Link href="/" className="hover:text-white transition">
              {t("features")}
            </Link>
            <br />
            <Link href="/" className="hover:text-white transition">
              {t("marketplace")}
            </Link>
            <br />
            <Link href="/role-selection" className="hover:text-white transition">
              {t("login")}
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">{t("contactLabel")}</h3>

          <p className="text-sm">Email: support@agritechai.com</p>
          <p className="text-sm mt-1">India</p>
        </div>
      </div>

      <div className="text-center mt-10 text-sm text-gray-500">
        {t("copyrightText")}
      </div>
    </footer>
  );
}