"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserCropAnalyses, clearAllCropAnalyses } from "@/services/analysisService";
import { getUserTerraceAnalyses } from "@/services/terraceService";
import { useLanguage } from "@/components/common/LanguageContext";
import { Button } from "@/components/ui/button";

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

  const formatTimestamp = (item: any): string => {
    if (!item) return "Just now";
    if (item.analyzedAtFormatted) return item.analyzedAtFormatted;
    if (item.createdAtFormatted) return item.createdAtFormatted;

    const timestamp = item.createdAt || item.analyzedAt || item.timestampMs;
    if (!timestamp) return "Just now";

    let dateObj: Date | null = null;
    if (typeof timestamp.toDate === "function") {
      dateObj = timestamp.toDate();
    } else if (timestamp?.seconds) {
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === "string" || typeof timestamp === "number") {
      dateObj = new Date(timestamp);
    }

    if (dateObj && !isNaN(dateObj.getTime())) {
      return dateObj.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    return "Just now";
  };

  const handleClearCropAnalyses = async () => {
    if (!confirm("Are you sure you want to delete all records from the crop_analysis collection?")) {
      return;
    }
    try {
      setLoading(true);
      const count = await clearAllCropAnalyses();
      alert(`Deleted ${count} record(s). The crop_analysis collection will be recreated automatically on your next analysis.`);
      setHistory((prev) => prev.filter((item) => item.type !== "crop"));
    } catch (err: any) {
      console.error("Failed to clear crop_analysis collection:", err);
      alert("Error clearing collection: " + err.message);
    } finally {
      setLoading(false);
    }
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

  const hasCropRecords = history.some((item) => item.type === "crop");

  return (
    <div className="space-y-6">
      {hasCropRecords && (
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
          <div>
            <h4 className="text-sm font-bold text-gray-800">🌱 Crop Health History</h4>
            <p className="text-xs text-gray-500">Manage or reset crop_analysis collection documents</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleClearCropAnalyses}
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 font-semibold rounded-xl"
          >
            🗑️ Clear Crop Analysis Collection
          </Button>
        </div>
      )}

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
                📅 {formatTimestamp(item)}
              </span>
            </div>

            {isCrop ? (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {item.crop || item.cropName || t("notAvailable")}
                  </h2>
                  {item.confidence && (
                    <span className="text-xs bg-gray-100 font-semibold px-2.5 py-1 rounded-full text-gray-700">
                      🎯 {item.confidence}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p className="text-gray-600">
                    <strong>{t("healthLabel")}:</strong> {item.health || item.healthStatus || t("notAvailable")}
                  </p>
                  <p className="text-gray-600">
                    <strong>{t("diseaseLabel")}:</strong> <span className={item.disease && item.disease !== "No visible disease" ? "text-red-600 font-semibold" : "text-green-600 font-semibold"}>{item.disease || t("notAvailable")}</span>
                  </p>
                  <p className="text-gray-600">
                    <strong>{t("severityLabel")}:</strong> {item.severity || t("notAvailable")}
                  </p>
                  <p className="text-gray-600">
                    <strong>Recovery Time:</strong> {item.recoveryTime || t("notAvailable")}
                  </p>
                </div>

                {item.cause && (
                  <p className="text-gray-600 text-sm">
                    <strong>{t("causeLabel")}:</strong> {item.cause}
                  </p>
                )}

                {item.recommendation && (
                  <p className="text-gray-600 text-sm">
                    <strong>{t("recommendationLabel")}:</strong> {item.recommendation}
                  </p>
                )}

                {item.analysisSummary && (
                  <div className="bg-green-50 rounded-2xl p-4 mt-2 text-sm text-green-900 leading-relaxed border border-green-100">
                    <strong>📋 {t("aiSummaryLabel")}:</strong> {item.analysisSummary}
                  </div>
                )}
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