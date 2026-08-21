"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import CropAnalysisCard from "./CropAnalysisCard";
import AiCropRecoveryKit from "./AiCropRecoveryKit";
import { saveAnalysis } from "@/services/analysisService";
import { useLanguage } from "@/components/common/LanguageContext";
import { useMarketplace } from "@/components/marketplace/MarketplaceContext";
import { RecommendationEngine } from "@/services/recommendationEngine";
import { RecoveryKitService } from "@/services/recoveryKitService";
import { RecoveryKit } from "@/types/recoveryKit";
import { auth } from "@/lib/firebase";

type CameraStatus = "inactive" | "active" | "analyzing" | "error" | "permission_denied";

export interface WebcamTelemetry {
  captureTimeMs: number;
  apiRoundtripMs: number;
}

type WebcamScannerProps = {
  compact?: boolean;
  onAnalysisCompleted?: (analysis: any, telemetry: WebcamTelemetry) => void;
};

export default function WebcamScanner({ compact = false, onAnalysisCompleted }: WebcamScannerProps) {
  const { t } = useLanguage();
  const { products: marketplaceProducts } = useMarketplace();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [status, setStatus] = useState<CameraStatus>("inactive");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [telemetry, setTelemetry] = useState<WebcamTelemetry | null>(null);

  const [analysis, setAnalysis] = useState<any | null>(null);
  const [recoveryKit, setRecoveryKit] = useState<RecoveryKit | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Stop camera tracks helper
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("inactive");
  }, []);

  // Cleanup media tracks on unmount or navigation
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Request browser camera stream on explicit user click
  const startCamera = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatus("error");
        setErrorMessage("Camera access is not supported by your browser.");
        return;
      }

      // Stop any existing stream before starting a new one
      stopCamera();

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (fallbackErr: any) {
        // Fallback for laptops/desktops without rear environment camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setStatus("active");
    } catch (err: any) {
      console.error("Camera permission / access error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setStatus("permission_denied");
        setErrorMessage("Camera permission was denied. Please allow camera access to use Live Monitoring.");
      } else {
        setStatus("error");
        setErrorMessage("Unable to access camera. Please check your camera settings and try again.");
      }
    }
  };

  // Capture current video frame and analyze using existing Gemini API pipeline
  const captureAndAnalyze = async () => {
    if (!videoRef.current || status !== "active") return;

    try {
      setLoading(true);
      setStatus("analyzing");
      setErrorMessage(null);
      setRecoveryKit(null);

      // 1. Measure Frame Capture Time
      const captureStart = performance.now();
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to create canvas 2D rendering context.");
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64Image = dataUrl.split(",")[1];
      const captureEnd = performance.now();
      const captureTimeMs = captureEnd - captureStart;

      // 2. Measure API Roundtrip Time (/api/analyze -> Gemini API)
      const apiStart = performance.now();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned status ${response.status}`);
      }

      const data = await response.json();
      const apiEnd = performance.now();
      const apiRoundtripMs = apiEnd - apiStart;

      const result = typeof data.result === "string" ? JSON.parse(data.result) : data.result;

      setAnalysis(result);

      // 3. Save to Firestore via existing analysisService
      const cropAnalysisId = await saveAnalysis(result);

      // 4. Generate & Save Recovery Kit via existing recommendationEngine & recoveryKitService
      const { recommendations, timeline, estimatedTotalCost } = RecommendationEngine.generateRecoveryKit(
        result,
        marketplaceProducts
      );

      const kitData = {
        cropAnalysisId,
        recommendations,
        timeline,
        estimatedTotalCost,
      };

      const recoveryKitId = await RecoveryKitService.saveRecoveryKit(kitData);
      const fullKit: RecoveryKit = {
        id: recoveryKitId,
        uid: auth.currentUser?.uid || "",
        ...kitData,
      };

      setRecoveryKit(fullKit);
      setShowAnalysis(true);

      const telemetryData: WebcamTelemetry = {
        captureTimeMs,
        apiRoundtripMs,
      };

      setTelemetry(telemetryData);
      if (onAnalysisCompleted) {
        onAnalysisCompleted(result, telemetryData);
      }

      setStatus("active");
    } catch (error: any) {
      console.error("Camera frame analysis failed:", error);
      setStatus("active");
      setErrorMessage("Unable to analyze the camera image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Guidance Banner */}
      <div className="bg-green-50/60 border border-green-200 text-green-900 p-4 rounded-2xl text-sm leading-relaxed">
        💡 <strong>Instructions:</strong> Place one plant leaf clearly inside the camera view. Good lighting and a close-up leaf image improve analysis accuracy.
      </div>

      {/* Video Preview Container */}
      <div className="relative aspect-video w-full max-w-2xl mx-auto rounded-3xl overflow-hidden bg-gray-900 border-2 border-gray-800 shadow-inner flex items-center justify-center">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${status === "active" || status === "analyzing" ? "block" : "hidden"}`}
          playsInline
          muted
        />

        {/* Video Overlay / Target alignment frame */}
        {(status === "active" || status === "analyzing") && (
          <div className="absolute inset-0 pointer-events-none border-[24px] border-black/30 flex items-center justify-center">
            <div className="w-56 h-56 border-4 border-dashed border-green-400/80 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-xs font-bold text-green-400 bg-black/50 px-3 py-1 rounded-full">
                Align Leaf Here
              </span>
            </div>
          </div>
        )}

        {/* Inactive State Display */}
        {status === "inactive" && (
          <div className="text-center p-8 space-y-4">
            <span className="text-5xl">📷</span>
            <p className="text-gray-400 text-sm font-medium">Camera is inactive</p>
            <Button onClick={startCamera} className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl px-6">
              Start Camera
            </Button>
          </div>
        )}

        {/* Permission Denied State */}
        {status === "permission_denied" && (
          <div className="text-center p-8 space-y-3 bg-red-950/80 text-white w-full h-full flex flex-col items-center justify-center">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm font-bold text-red-200">{errorMessage}</p>
            <Button variant="outline" onClick={startCamera} className="text-white border-white hover:bg-white/10 rounded-xl text-xs">
              Retry Camera Permission
            </Button>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="text-center p-8 space-y-3 bg-red-950/80 text-white w-full h-full flex flex-col items-center justify-center">
            <span className="text-4xl">❌</span>
            <p className="text-sm font-medium text-red-200">{errorMessage}</p>
            <Button variant="outline" onClick={startCamera} className="text-white border-white hover:bg-white/10 rounded-xl text-xs">
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Camera Status Badge & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-2xl mx-auto bg-gray-50 p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-gray-500">Camera Status:</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              status === "active"
                ? "bg-green-100 text-green-800"
                : status === "analyzing"
                ? "bg-yellow-100 text-yellow-800 animate-pulse"
                : status === "permission_denied" || status === "error"
                ? "bg-red-100 text-red-800"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {status === "active"
              ? "🟢 Camera Active"
              : status === "analyzing"
              ? "⚡ Analyzing Plant..."
              : status === "permission_denied"
              ? "⛔ Permission Denied"
              : status === "error"
              ? "❌ Camera Error"
              : "⚪ Camera Inactive"}
          </span>
        </div>

        <div className="flex gap-2">
          {(status === "active" || status === "analyzing") && (
            <>
              <Button
                variant="outline"
                onClick={stopCamera}
                disabled={loading}
                className="text-xs font-semibold rounded-xl"
              >
                ⏹️ Stop Camera
              </Button>
              <Button
                onClick={captureAndAnalyze}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs px-4"
              >
                {loading ? "⚡ Analyzing Frame..." : "🔬 Capture & Analyze"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Non-fatal User Error Banner */}
      {errorMessage && status === "active" && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs font-medium text-center">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* Telemetry Display */}
      {telemetry && (
        <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 flex flex-wrap gap-6 text-xs font-medium text-gray-500 justify-around max-w-2xl mx-auto">
          <div>📸 Frame Encoding: <span className="font-bold text-gray-800">{telemetry.captureTimeMs.toFixed(1)} ms</span></div>
          <div>⚡ Gemini Roundtrip: <span className="font-bold text-gray-800">{telemetry.apiRoundtripMs.toFixed(1)} ms</span></div>
        </div>
      )}

      {/* Diagnostic Analysis Card Results */}
      {!compact && showAnalysis && analysis && (
        <div className="space-y-6 pt-4 border-t border-gray-100">
          <CropAnalysisCard analysis={analysis} />
          {recoveryKit && <AiCropRecoveryKit recoveryKit={recoveryKit} />}
        </div>
      )}
    </div>
  );
}
