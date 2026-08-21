"use client";

import { useState } from "react";
import WebcamScanner, { WebcamTelemetry } from "@/components/crop/WebcamScanner";
import CropAnalysisCard from "@/components/crop/CropAnalysisCard";

export default function LiveCameraMonitoring() {
  const [latestAnalysis, setLatestAnalysis] = useState<any | null>(null);
  const [latestTimestamp, setLatestTimestamp] = useState<string | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<WebcamTelemetry | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const handleAnalysisCompleted = (analysis: any, telemetry: WebcamTelemetry) => {
    setLatestAnalysis(analysis);
    setLatestTelemetry(telemetry);
    setLatestTimestamp(
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  };

  return (
    <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📹 Live Camera Monitoring
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Real-time crop diagnostic scanner powered by Google Gemini API
          </p>
        </div>
      </div>

      {/* Embedded Compact Webcam Scanner */}
      <WebcamScanner compact onAnalysisCompleted={handleAnalysisCompleted} />

      {/* Latest Observation Panel */}
      {latestAnalysis && (
        <div className="bg-green-50/60 border border-green-200 rounded-2xl p-5 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-green-950 flex items-center gap-2">
              📋 Latest Observation
            </h3>
            {latestTimestamp && (
              <span className="text-xs font-semibold text-green-700 bg-white/70 px-2.5 py-1 rounded-full border border-green-200">
                🕒 Captured at {latestTimestamp}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white/80 p-3 rounded-xl border border-green-100">
              <span className="text-gray-400 font-semibold block">CROP</span>
              <span className="font-bold text-gray-800 text-sm">{latestAnalysis.crop || "Unknown"}</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-green-100">
              <span className="text-gray-400 font-semibold block">HEALTH</span>
              <span className="font-bold text-gray-800 text-sm">{latestAnalysis.health || "N/A"}</span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-green-100">
              <span className="text-gray-400 font-semibold block">DIAGNOSIS</span>
              <span className={`font-bold text-sm ${latestAnalysis.disease && latestAnalysis.disease !== "No visible disease" ? "text-red-600" : "text-green-700"}`}>
                {latestAnalysis.disease || "No visible disease"}
              </span>
            </div>
            <div className="bg-white/80 p-3 rounded-xl border border-green-100">
              <span className="text-gray-400 font-semibold block">CONFIDENCE</span>
              <span className="font-bold text-gray-800 text-sm">{latestAnalysis.confidence || "N/A"}</span>
            </div>
          </div>

          {latestAnalysis.analysisSummary && (
            <p className="text-xs text-green-900 font-medium leading-relaxed bg-white/60 p-3 rounded-xl">
              <strong>Summary:</strong> {latestAnalysis.analysisSummary}
            </p>
          )}

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="text-xs text-green-800 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              {showFullDetails ? "▲ Hide Full Details" : "▼ View Full Diagnostic Report"}
            </button>

            {latestTelemetry && (
              <span className="text-[11px] text-gray-400 font-medium">
                ⚡ API: {latestTelemetry.apiRoundtripMs.toFixed(0)}ms | 📸 Capture: {latestTelemetry.captureTimeMs.toFixed(0)}ms
              </span>
            )}
          </div>

          {showFullDetails && (
            <div className="pt-4 border-t border-green-200">
              <CropAnalysisCard analysis={latestAnalysis} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
