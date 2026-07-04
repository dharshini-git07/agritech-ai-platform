"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserCropAnalyses } from "@/services/analysisService";
import { getUserTerraceAnalyses } from "@/services/terraceService";
import { useLanguage } from "@/components/common/LanguageContext";

export default function AnalysisHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const uid = user.uid;
        async function loadHistory() {
          try {
            setError(null);
            const [cropData, terraceData] = await Promise.all([
              getUserCropAnalyses(uid),
              getUserTerraceAnalyses(uid),
            ]);

            const merged = [...cropData, ...terraceData];
            const sorted = merged.sort((a, b) => {
              const dateA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
              const dateB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
              return dateB - dateA;
            });

            setHistory(sorted);
          } catch (err: any) {
            console.error("Error loading timeline history:", err);
            setError(err.message || "Failed to load history records.");
          } finally {
            setLoading(false);
          }
        }
        loadHistory();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) return "Just now";
    if (typeof timestamp.toDate === "function") {
      return timestamp.toDate().toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500 font-medium">
        {t("loadingHistory")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 rounded-3xl p-6 text-center shadow-lg max-w-md mx-auto">
        <p className="font-semibold">⚠️ Error Loading History</p>
        <p className="text-sm mt-2">{error}</p>
        <p className="text-xs text-gray-400 mt-4">
          If you see a query index error, click the link in your browser developer tools console to generate it.
        </p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 bg-white rounded-3xl shadow-md p-8 max-w-xl mx-auto">
        <h3 className="text-xl font-bold mb-2">{t("noHistoryTitle")}</h3>
        <p className="text-gray-400">
          {t("noHistoryDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {history.map((item) => {
        const isCrop = item.type === "crop";
        return (
          <div
            key={item.id}
            className="bg-white rounded-3xl shadow-lg p-6 space-y-4"
          >
            <div className="flex justify-between items-center">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isCrop
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {isCrop ? `🌱 ${t("cropAnalysis")}` : `🏠 ${t("terracePlanner")}`}
              </span>
              <span className="text-xs font-medium text-gray-400">
                {formatTimestamp(item.createdAt)}
              </span>
            </div>

            {isCrop ? (
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  {item.crop || t("notAvailable")}
                </h2>
                <p className="text-gray-650 text-sm">
                  <strong>{t("healthLabel")}:</strong> {item.health || t("notAvailable")}
                </p>
                <p className="text-gray-650 text-sm">
                  <strong>{t("diseaseLabel")}:</strong> {item.disease || t("notAvailable")}
                </p>
                <p className="text-gray-650 text-sm">
                  <strong>{t("severityLabel")}:</strong> {item.severity || t("notAvailable")}
                </p>
                <p className="text-gray-650 text-sm">
                  <strong>{t("recommendationLabel")}:</strong> {item.recommendation || t("notAvailable")}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  Terrace Setup
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p className="text-gray-650">
                    <strong>{t("terraceAreaLabel")}:</strong> {item.terraceArea || t("notAvailable")}
                  </p>
                  <p className="text-gray-650">
                    <strong>{t("usableAreaLabel")}:</strong> {item.usableArea || t("notAvailable")}
                  </p>
                </div>
                <p className="text-gray-655 text-sm">
                  <strong>{t("sunlightLabel")}:</strong> {item.sunlight || t("notAvailable")}
                </p>
                <p className="text-sm font-semibold text-green-700">
                  <strong>{t("estimatedCostLabel")}:</strong> {item.estimatedCost || t("notAvailable")}
                </p>
                <p className="text-gray-655 text-sm">
                  <strong>{t("confidenceLabel")}:</strong> {item.confidence || t("notAvailable")}
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 mt-2 text-sm text-gray-700 leading-relaxed">
                  <strong>{t("summaryLabel")}:</strong> {item.analysisSummary || t("notAvailable")}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}