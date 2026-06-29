import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TerraceUploader from "@/components/terrace/TerraceUploader";

export default function TerracePlannerPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-6xl mx-auto py-10 px-6">
        <h1 className="text-4xl font-bold mb-3">
          🏠 Terrace Planner
        </h1>

        <p className="text-gray-500 mb-8">
          Upload your terrace images to receive AI-powered planning,
          layout suggestions, sunlight analysis, drainage assessment,
          and setup recommendations.
        </p>

        <TerraceUploader />
      </main>
    </ProtectedRoute>
  );
}