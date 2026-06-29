"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import CropAnalysisCard from "./CropAnalysisCard";
import CropLoading from "./CropLoading";
import { saveAnalysis } from "@/services/analysisService";

export default function CropUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

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
      alert("Please select an image first.");
      return;
    }

    try {
      setLoading(true);

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

      console.log(data);

      const result = JSON.parse(data.result);

      setAnalysis(result);

      await saveAnalysis(result);

      setShowAnalysis(true);

    } catch (error) {
      console.error(error);
      alert("AI Analysis Failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-green-400 rounded-3xl p-12 text-center cursor-pointer hover:bg-green-50 transition"
      >
        <h2 className="text-2xl font-bold">
          🌱 Upload Crop Image
        </h2>

        <p className="text-gray-500 mt-3">
          Upload a crop or leaf image for AI health analysis.
        </p>
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
            className="rounded-3xl w-full object-cover shadow-lg"
          />

          <Button
            className="w-full"
            onClick={handleAnalyze}
          >
            Analyze Crop
          </Button>

          {loading && (
            <div className="bg-white rounded-3xl shadow-lg p-10 text-center">

              <h2 className="text-2xl font-bold">
                🤖 AI is analyzing your crop...
              </h2>

              <p className="text-gray-500 mt-4">
                Identifying crop, detecting diseases and preparing recommendations...
              </p>

            </div>
          )}

          {showAnalysis && (
            <CropAnalysisCard analysis={analysis} />
          )}

        </div>
      )}
    </div>
  );
}