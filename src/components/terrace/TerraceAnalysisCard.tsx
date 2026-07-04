import { Card, CardContent } from "@/components/ui/card";
import { TerraceAnalysis } from "@/types/terrace";

type TerraceAnalysisCardProps = {
  analysis: TerraceAnalysis;
};

export default function TerraceAnalysisCard({
  analysis,
}: TerraceAnalysisCardProps) {
  return (
    <Card className="rounded-3xl shadow-lg">
      <CardContent className="space-y-5 p-8">
        <h2 className="text-3xl font-bold">
          🏠 Terrace Planning Report
        </h2>

        {analysis.analysisSummary && (
          <div className="bg-green-50 text-green-800 rounded-2xl p-4 text-sm font-medium">
            💡 {analysis.analysisSummary}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-500">Terrace Area</h3>
            <p className="font-medium text-lg">{analysis.terraceArea}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-500">Usable Area</h3>
            <p className="font-medium text-lg">{analysis.usableArea}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-500">Sunlight</h3>
          <p className="font-medium">{analysis.sunlight}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">Drainage</h3>
          <p className="font-medium">{analysis.drainage}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">Suggested Layout</h3>
          <p className="font-medium">{analysis.layout}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">Crop Suggestions</h3>
          <div className="flex flex-wrap gap-2 mt-1">
            {analysis.cropSuggestions && analysis.cropSuggestions.length > 0 ? (
              analysis.cropSuggestions.map((crop, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full font-medium"
                >
                  {crop}
                </span>
              ))
            ) : (
              <span className="text-gray-400">No suggestions available</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">Estimated Cost</h3>
          <p className="font-medium text-green-700 font-semibold">{analysis.estimatedCost}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">AI Recommendations</h3>
          <p className="text-gray-700">{analysis.recommendation}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">AI Confidence</h3>
          <p className="text-gray-700">{analysis.confidence}</p>
        </div>
      </CardContent>
    </Card>
  );
}