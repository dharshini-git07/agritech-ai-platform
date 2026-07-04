"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { translations } from "@/lib/translations";

export type Language = "en" | "ta" | "hi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: keyof typeof translations["en"]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Auto-detect or restore preferred language from Firebase & cookies
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists() && docSnap.data().preferredLanguage) {
            const lang = docSnap.data().preferredLanguage as Language;
            setLanguageState(lang);
            document.cookie = `preferredLanguage=${lang}; path=/; max-age=31536000; SameSite=Lax`;
            return;
          }
        } catch (err) {
          console.error("Error reading preferred language:", err);
        }
      }

      // Check cookie first
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("preferredLanguage="))
        ?.split("=")[1];

      if (cookieValue === "en" || cookieValue === "ta" || cookieValue === "hi") {
        setLanguageState(cookieValue as Language);
      } else {
        const browserLang = navigator.language.slice(0, 2);
        if (browserLang === "ta" || browserLang === "hi") {
          setLanguageState(browserLang as Language);
        } else {
          setLanguageState("en");
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);

    // Save to cookies for server-side endpoints access
    document.cookie = `preferredLanguage=${lang}; path=/; max-age=31536000; SameSite=Lax`;

    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          preferredLanguage: lang,
        });
      } catch (err) {
        console.error("Failed to update preferred language in Firestore:", err);
      }
    }
  };

  const t = (key: keyof typeof translations["en"]): string => {
    return translations[language]?.[key] || translations["en"]?.[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
