"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TerraceLoading from "./TerraceLoading";
import TerraceAnalysisCard from "./TerraceAnalysisCard";

export default function TerraceUploader() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setImage(URL.createObjectURL(file));
    setShowResult(false);
  };

  const handleAnalyze = () => {
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setShowResult(true);
    }, 2500);
  };

  return (
    <div className="space-y-8">

      <div
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-green-400 rounded-3xl p-12 text-center cursor-pointer hover:bg-green-50"
      >
        <h2 className="text-2xl font-bold">
          🏠 Upload Terrace Image
        </h2>

        <p className="text-gray-500 mt-3">
          Upload your terrace photo for AI planning.
        </p>
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

          <Button
            className="w-full"
            onClick={handleAnalyze}
          >
            Analyze Terrace
          </Button>
        </>
      )}

      {loading && <TerraceLoading />}

      {showResult && <TerraceAnalysisCard />}

    </div>
  );
}