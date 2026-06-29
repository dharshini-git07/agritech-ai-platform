import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ImageUploader from "@/components/crop/CropUploader";

export default function CropAnalysisPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-5xl mx-auto py-10 px-6">

        <h1 className="text-4xl font-bold mb-3">
          🌱 Crop Health Analysis
        </h1>

        <p className="text-gray-500 mb-8">
          Upload a crop or leaf image to detect diseases, assess plant health,
          identify the crop, and receive AI-powered recommendations.
        </p>

        <ImageUploader />

      </main>
    </ProtectedRoute>
  );
}