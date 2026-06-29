import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AnalysisHistory from "@/components/history/AnalysisHistory";

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <main className="max-w-6xl mx-auto py-10 px-6">

        <h1 className="text-4xl font-bold mb-3">
          📜 Analysis History
        </h1>

        <p className="text-gray-500 mb-8">
          View all your previous AI crop analyses.
        </p>

        <AnalysisHistory />

      </main>
    </ProtectedRoute>
  );
}