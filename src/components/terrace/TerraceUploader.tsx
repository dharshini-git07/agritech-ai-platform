"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TerraceLoading from "./TerraceLoading";
import TerraceAnalysisCard from "./TerraceAnalysisCard";
import { TerraceAnalysis } from "@/types/terrace";
import { saveTerraceAnalysis } from "@/services/terraceService";
import { useLanguage } from "@/components/common/LanguageContext";

export default function TerraceUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const [analysisMode, setAnalysisMode] = useState<"image" | "manual" | "hybrid">("hybrid");

  // Form states
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [floor, setFloor] = useState("");
  const [city, setCity] = useState("");
  const [budget, setBudget] = useState("");
  const [preference, setPreference] = useState("Mixed");

  // Visual state
  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [analysis, setAnalysis] = useState<TerraceAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setImage(URL.createObjectURL(file));
    setShowResult(false);
    setError(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
    });
  };

  const handleAnalyze = async () => {
    // Mode specific validations
    if (analysisMode === "image" || analysisMode === "hybrid") {
      if (!selectedFile) {
        alert(t("selectImageAlert"));
        return;
      }
    }
    if (analysisMode === "manual" || analysisMode === "hybrid") {
      if (!length || !width || !floor || !city || !budget) {
        alert("Please fill in all manual planning fields first.");
        return;
      }
    }

    setLoading(true);
    setError(null);
    setShowResult(false);

    try {
      let base64Image = null;
      if (selectedFile && (analysisMode === "image" || analysisMode === "hybrid")) {
        base64Image = await fileToBase64(selectedFile);
      }

      const payload = {
        image: base64Image,
        manualDetails: {
          length,
          width,
          floor,
          city,
          budget,
          preference,
        },
        mode: analysisMode,
      };

      const response = await fetch("/api/terrace-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(t("analyzeFailedError"));
      }

      const data = await response.json();

      let parsedAnalysis: TerraceAnalysis;
      try {
        parsedAnalysis = JSON.parse(data.result);
      } catch (parseErr) {
        console.error("JSON parsing error:", parseErr);
        setError(t("invalidResponseAlert"));
        return;
      }

      setAnalysis(parsedAnalysis);
      setShowResult(true);

      // Perform Firestore save. If it fails, report card must still remain visible.
      try {
        await saveTerraceAnalysis(parsedAnalysis);
      } catch (dbErr) {
        console.error("Firestore save failed:", dbErr);
        setError(t("saveFailedWarning"));
      }
    } catch (err: any) {
      console.error("Terrace analysis failed:", err);
      setError(t("analyzeFailedError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Choose Analysis Mode Selector */}
      <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          ⚙️ {t("chooseAnalysisMode")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
              analysisMode === "image"
                ? "border-green-500 bg-green-50/50 text-green-950"
                : "border-gray-150 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <input
              type="radio"
              name="analysisMode"
              value="image"
              checked={analysisMode === "image"}
              onChange={() => {
                setAnalysisMode("image");
                setError(null);
              }}
              className="accent-green-600 w-4 h-4 cursor-pointer"
            />
            <span className="font-semibold text-sm">{t("imageAnalysis")}</span>
          </label>

          <label
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
              analysisMode === "manual"
                ? "border-green-500 bg-green-50/50 text-green-950"
                : "border-gray-150 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <input
              type="radio"
              name="analysisMode"
              value="manual"
              checked={analysisMode === "manual"}
              onChange={() => {
                setAnalysisMode("manual");
                setError(null);
              }}
              className="accent-green-600 w-4 h-4 cursor-pointer"
            />
            <span className="font-semibold text-sm">{t("manualPlanning")}</span>
          </label>

          <label
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition ${
              analysisMode === "hybrid"
                ? "border-green-500 bg-green-50/50 text-green-950"
                : "border-gray-150 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <input
              type="radio"
              name="analysisMode"
              value="hybrid"
              checked={analysisMode === "hybrid"}
              onChange={() => {
                setAnalysisMode("hybrid");
                setError(null);
              }}
              className="accent-green-600 w-4 h-4 cursor-pointer"
            />
            <span className="font-semibold text-sm">
              {t("hybridAnalysis")}
            </span>
          </label>
        </div>
      </div>

      {/* Manual Details Form */}
      {(analysisMode === "manual" || analysisMode === "hybrid") && (
        <div className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3">
            📏 {t("manualPlanning")} Details
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("terraceLength")}
              </label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("terraceWidth")}
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("buildingFloor")}
              </label>
              <input
                type="text"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                placeholder="e.g. 3rd Floor"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("city")}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Chennai"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("budget")}
              </label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 5000 INR"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                {t("farmingPreference")}
              </label>
              <select
                value={preference}
                onChange={(e) => setPreference(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 cursor-pointer"
              >
                <option value="Soil Farming">{t("soilFarming")}</option>
                <option value="Hydroponics">{t("hydroponics")}</option>
                <option value="Mixed">{t("mixedFarming")}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Image Uploader Block */}
      {(analysisMode === "image" || analysisMode === "hybrid") && (
        <div className="space-y-6">
          <div
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-green-400 rounded-3xl p-12 text-center cursor-pointer hover:bg-green-50 transition"
          >
            <h2 className="text-2xl font-bold">{t("uploadTerraceImage")}</h2>

            <p className="text-gray-500 mt-3">{t("uploadTerraceDesc")}</p>
          </div>

          <input
            hidden
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={handleImage}
          />

          {image && (
            <div className="mt-4">
              <Image
                src={image}
                alt="Terrace"
                width={900}
                height={600}
                className="rounded-3xl shadow-lg w-full object-cover"
              />
            </div>
          )}
        </div>
      )}

      {/* Unified planning buttons */}
      {!loading && (
        <Button className="w-full py-6 text-base rounded-2xl cursor-pointer" onClick={handleAnalyze}>
          {analysisMode === "image"
            ? t("analyzeTerraceButton")
            : analysisMode === "manual"
            ? t("generatePlanButton")
            : t("generateHybridPlanButton")}
        </Button>
      )}

      {loading && <TerraceLoading />}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-3xl p-6 text-center shadow-md border border-red-100">
          <p className="font-semibold">
            {analysis ? t("warningLabel") : t("analysisFailedLabel")}
          </p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {showResult && analysis && <TerraceAnalysisCard analysis={analysis} />}
    </div>
  );
}