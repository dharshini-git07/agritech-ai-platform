"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CropAnalysisCard from "./CropAnalysisCard";
import { saveAnalysis } from "@/services/analysisService";
import { useLanguage } from "@/components/common/LanguageContext";
import { useMarketplace } from "@/components/marketplace/MarketplaceContext";
import { RecommendationEngine } from "@/services/recommendationEngine";
import { RecoveryKitService } from "@/services/recoveryKitService";
import { RecoveryKit } from "@/types/recoveryKit";
import { auth } from "@/lib/firebase";
import AiCropRecoveryKit from "./AiCropRecoveryKit";
import WebcamScanner from "./WebcamScanner";

export default function CropUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const { products: marketplaceProducts } = useMarketplace();

  const [activeTab, setActiveTab] = useState<"upload" | "camera">("upload");

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [recoveryKit, setRecoveryKit] = useState<RecoveryKit | null>(null);

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setShowAnalysis(false);
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

    try {
      setLoading(true);
      setRecoveryKit(null);

      const base64Image = await fileToBase64(selectedFile);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: base64Image,
        }),
      });

      const data = await response.json();

      const result = typeof data.result === "string" ? JSON.parse(data.result) : data.result;

      setAnalysis(result);

      const cropAnalysisId = await saveAnalysis(result);

      // Generate and save AI Crop Recovery Kit
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
      setRecoveryKit({
        id: recoveryKitId,
        uid: auth.currentUser?.uid || "",
        ...kitData,
      });

      setShowAnalysis(true);
    } catch (error) {
      console.error(error);
      alert(t("analysisFailedAlert"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-gray-150 gap-6">
        <button
          onClick={() => setActiveTab("upload")}
          className={`pb-3 text-base font-bold transition-colors cursor-pointer ${
            activeTab === "upload"
              ? "border-b-2 border-green-600 text-green-700"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          📁 Upload Image
        </button>
        <button
          onClick={() => setActiveTab("camera")}
          className={`pb-3 text-base font-bold transition-colors cursor-pointer ${
            activeTab === "camera"
              ? "border-b-2 border-green-600 text-green-700"
              : "text-gray-400 hover:text-gray-600"
          }`}
        >
          📷 Camera Scanner
        </button>
      </div>

      {/* Tab 1: File Upload Mode */}
      {activeTab === "upload" && (
        <div className="space-y-8">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-green-400 rounded-3xl p-12 text-center cursor-pointer hover:bg-green-50 transition"
          >
            <h2 className="text-2xl font-bold">{t("uploadCropImage")}</h2>
            <p className="text-gray-500 mt-3">{t("uploadCropDesc")}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImageChange}
          />

          {selectedImage && (
            <div className="space-y-6">
              <Image
                src={selectedImage}
                alt="Crop Preview"
                width={900}
                height={600}
                className="rounded-3xl w-full object-cover shadow-lg max-h-[500px]"
              />

              <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl" onClick={handleAnalyze}>
                {t("analyzeCropButton")}
              </Button>

              {loading && (
                <div className="bg-white rounded-3xl shadow-lg p-10 text-center">
                  <h2 className="text-2xl font-bold">{t("analyzingCropText")}</h2>
                  <p className="text-gray-500 mt-4">{t("analyzingCropDesc")}</p>
                </div>
              )}

              {showAnalysis && <CropAnalysisCard analysis={analysis} />}
              {showAnalysis && recoveryKit && <AiCropRecoveryKit recoveryKit={recoveryKit} />}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Browser Camera Mode */}
      {activeTab === "camera" && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150">
          <WebcamScanner />
        </div>
      )}
    </div>
  );
}