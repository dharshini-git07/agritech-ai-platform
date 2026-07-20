import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriTech AI - Smart Terrace Farming & AI Digital Twin",
  description: "AI-powered terrace analysis, digital twin layout planner, crop suitability matching, and hydroponics management platform.",
};

import { LanguageProvider } from "@/components/common/LanguageContext";
import { MarketplaceProvider } from "@/components/marketplace/MarketplaceContext";
import { NotificationProvider } from "@/components/common/NotificationContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <MarketplaceProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </MarketplaceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
