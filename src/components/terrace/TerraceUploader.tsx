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
    if (!selectedFile) {
      alert(t("selectImageAlert"));
      return;
    }

    setLoading(true);
    setError(null);
    setShowResult(false);

    try {
      const base64Image = await fileToBase64(selectedFile);

      const response = await fetch("/api/terrace-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
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
      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-green-400 rounded-3xl p-12 text-center cursor-pointer hover:bg-green-50"
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
        <>
          <Image
            src={image}
            alt="Terrace"
            width={900}
            height={600}
            className="rounded-3xl shadow-lg"
          />

          <Button className="w-full" onClick={handleAnalyze} disabled={loading}>
            {loading ? t("analyzingTerraceText") : t("analyzeTerraceButton")}
          </Button>
        </>
      )}

      {loading && <TerraceLoading />}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-3xl p-6 text-center shadow-md">
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