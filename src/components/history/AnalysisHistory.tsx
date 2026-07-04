"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getUserCropAnalyses } from "@/services/analysisService";
import { getUserTerraceAnalyses } from "@/services/terraceService";

export default function AnalysisHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        Loading analysis history...
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
        <h3 className="text-xl font-bold mb-2">No AI analysis history found</h3>
        <p className="text-gray-400">
          Run Crop Analysis or Terrace Planner to generate your first report.
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
                {isCrop ? "🌱 Crop Analysis" : "🏠 Terrace Analysis"}
              </span>
              <span className="text-xs text-gray-405 font-medium text-gray-400">
                {formatTimestamp(item.createdAt)}
              </span>
            </div>

            {isCrop ? (
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  {item.crop || "Unknown Crop"}
                </h2>
                <p className="text-gray-650 text-sm">
                  <strong>Health Status:</strong> {item.health || "N/A"}
                </p>
                <p className="text-gray-650 text-sm">
                  <strong>Disease:</strong> {item.disease || "N/A"}
                </p>
                <p className="text-gray-650 text-sm">
                  <strong>Severity:</strong> {item.severity || "N/A"}
                </p>
                <p className="text-gray-650 text-sm">
                  <strong>Recommendation:</strong> {item.recommendation || "N/A"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-800">
                  Terrace Setup
                </h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <p className="text-gray-650">
                    <strong>Terrace Area:</strong> {item.terraceArea || "N/A"}
                  </p>
                  <p className="text-gray-650">
                    <strong>Usable Area:</strong> {item.usableArea || "N/A"}
                  </p>
                </div>
                <p className="text-gray-655 text-sm">
                  <strong>Sunlight:</strong> {item.sunlight || "N/A"}
                </p>
                <p className="text-sm font-semibold text-green-700">
                  <strong>Estimated Cost:</strong> {item.estimatedCost || "N/A"}
                </p>
                <p className="text-gray-655 text-sm">
                  <strong>AI Confidence:</strong> {item.confidence || "N/A"}
                </p>
                <div className="bg-gray-50 rounded-2xl p-4 mt-2 text-sm text-gray-700 leading-relaxed">
                  <strong>Analysis Summary:</strong> {item.analysisSummary || "N/A"}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}