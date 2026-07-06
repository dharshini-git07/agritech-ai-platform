"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User, LogOut, Settings, Menu, X } from "lucide-react";
import { useLanguage, Language } from "@/components/common/LanguageContext";
import Link from "next/link";

export default function DashboardNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    role: string;
    email: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              name: data.name || "Farmer",
              role: data.role || "farmer",
              email: data.email || user.email || "",
            });
          } else {
            setProfile({
              name: user.displayName || "Farmer",
              role: "farmer",
              email: user.email || "",
            });
          }
        } catch (err) {
          console.error("Failed to load user profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Close drawer on path shift
  useEffect(() => {
    setShowMobileDrawer(false);
  }, [pathname]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  let pageTitleKey: "dashboard" | "cropAnalysis" | "terracePlanner" | "history" | "hydroponics" | "marketplace" = "dashboard";
  if (pathname.includes("/crop-analysis")) pageTitleKey = "cropAnalysis";
  else if (pathname.includes("/terrace-planner")) pageTitleKey = "terracePlanner";
  else if (pathname.includes("/history")) pageTitleKey = "history";
  else if (pathname.includes("/hydroponics")) pageTitleKey = "hydroponics";
  else if (pathname.includes("/marketplace")) pageTitleKey = "marketplace";

  return (
    <>
      <header className="flex justify-between items-center bg-white border-b border-gray-100 px-6 md:px-8 py-4 relative z-50">
        <div className="flex items-center">
          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setShowMobileDrawer(true)}
            className="lg:hidden mr-3 p-1.5 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-800 transition focus:outline-none cursor-pointer"
          >
            <Menu size={22} />
          </button>
          
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 capitalize">
            {t(pageTitleKey)}
          </h1>
        </div>

      {profile && (
        <div className="relative" ref={dropdownRef}>
          {/* Profile Header Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-2xl transition focus:outline-none select-none text-left cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-lg border border-green-200">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <p className="font-semibold text-gray-800 text-sm leading-tight">
                {profile.name}
              </p>
              <p className="text-xs text-gray-400 font-medium capitalize">
                {t(profile.role as any || "dashboard")}
              </p>
            </div>
          </button>

          {/* User Menu Dropdown */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-gray-100 py-3 text-sm text-gray-700 animate-in fade-in-50 slide-in-from-top-3 duration-200">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="font-bold text-gray-800 text-base">
                  {profile.name}
                </p>
                <p className="text-xs text-gray-400 capitalize font-medium">
                  {t(profile.role as any || "dashboard")}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {profile.email}
                </p>
              </div>

              {/* Language Selection */}
              <div className="px-5 py-3 border-b border-gray-100">
                <label className="text-xs text-gray-400 font-semibold block mb-1">
                  {t("languageLabel")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-green-400 cursor-pointer"
                >
                  <option value="en">English</option>
                  <option value="ta">தமிழ்</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>

              <div className="py-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/dashboard/profile");
                  }}
                  className="w-full text-left px-5 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-650 transition cursor-pointer"
                >
                  <User size={18} />
                  <span>{t("profile")}</span>
                </button>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/dashboard/settings");
                  }}
                  className="w-full text-left px-5 py-2.5 hover:bg-gray-50 flex items-center gap-3 text-gray-650 transition cursor-pointer"
                >
                  <Settings size={18} />
                  <span>{t("settings")}</span>
                </button>
              </div>

              <div className="border-t border-gray-100 pt-2 px-3">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-2xl flex items-center gap-3 transition font-semibold cursor-pointer"
                >
                  <LogOut size={18} />
                  <span>{t("logout")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      </header>

      {/* Mobile Sliding Navigation Drawer */}
      {showMobileDrawer && (
        <>
          {/* Overlay Blocker */}
          <div
            onClick={() => setShowMobileDrawer(false)}
            className="fixed inset-0 bg-black/40 z-[100] lg:hidden animate-in fade-in duration-200"
          />

          {/* Drawer Body Panel */}
          <aside className="fixed inset-y-0 left-0 w-64 bg-green-700 text-white z-[110] p-6 lg:hidden flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">🌱 AgriTech AI</h2>
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="space-y-4">
                <Link href="/dashboard" className="block hover:text-green-200 py-1 font-semibold text-sm">
                  {t("dashboard")}
                </Link>
                <Link href="/dashboard/terrace-planner" className="block hover:text-green-200 py-1 font-semibold text-sm">
                  🏠 {t("terracePlanner")}
                </Link>
                <Link href="/dashboard/crop-analysis" className="block hover:text-green-200 py-1 font-semibold text-sm">
                  🌱 {t("cropAnalysis")}
                </Link>
                <Link href="/dashboard/history" className="block hover:text-green-200 py-1 font-semibold text-sm">
                  📜 {t("history")}
                </Link>
                <Link href="/dashboard/hydroponics" className="block hover:text-green-200 py-1 font-semibold text-sm">
                  💧 {t("hydroponics")}
                </Link>
                <Link href="/marketplace" className="block hover:text-green-200 py-1 font-semibold text-sm">
                  🛒 {t("marketplace")}
                </Link>
              </nav>
            </div>

            {/* Profile Overview */}
            {profile && (
              <div className="border-t border-green-600/50 pt-4 flex flex-col gap-2">
                <div>
                  <p className="font-bold text-sm">{profile.name}</p>
                  <p className="text-[10px] text-green-200 opacity-80 capitalize">{t(profile.role as any || "dashboard")}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-bold text-red-200 hover:text-red-100 mt-2 flex items-center gap-1.5 cursor-pointer text-left focus:outline-none"
                >
                  <LogOut size={12} /> {t("logout")}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}