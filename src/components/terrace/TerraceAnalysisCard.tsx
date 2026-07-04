import { Card, CardContent } from "@/components/ui/card";
import { TerraceAnalysis } from "@/types/terrace";
import { useLanguage } from "@/components/common/LanguageContext";

type TerraceAnalysisCardProps = {
  analysis: TerraceAnalysis;
};

export default function TerraceAnalysisCard({
  analysis,
}: TerraceAnalysisCardProps) {
  const { t } = useLanguage();

  return (
    <Card className="rounded-3xl shadow-lg">
      <CardContent className="space-y-5 p-8">
        <h2 className="text-3xl font-bold">
          {t("terraceReportTitle")}
        </h2>

        {analysis.analysisSummary && (
          <div className="bg-green-50 text-green-800 rounded-2xl p-4 text-sm font-medium">
            💡 {analysis.analysisSummary}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-gray-500">{t("terraceAreaLabel")}</h3>
            <p className="font-medium text-lg">{analysis.terraceArea || t("notAvailable")}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-500">{t("usableAreaLabel")}</h3>
            <p className="font-medium text-lg">{analysis.usableArea || t("notAvailable")}</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        <div>
          <h3 className="font-semibold text-gray-500">{t("sunlightLabel")}</h3>
          <p className="font-medium">{analysis.sunlight || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("drainageLabel")}</h3>
          <p className="font-medium">{analysis.drainage || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("layoutLabel")}</h3>
          <p className="font-medium">{analysis.layout || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("cropSuggestionsLabel")}</h3>
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
              <span className="text-gray-400">{t("notAvailable")}</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("estimatedCostLabel")}</h3>
          <p className="font-medium text-green-700 font-semibold">{analysis.estimatedCost || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("recommendationLabel")}</h3>
          <p className="text-gray-700">{analysis.recommendation || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("confidenceLabel")}</h3>
          <p className="text-gray-700">{analysis.confidence || t("notAvailable")}</p>
        </div>
      </CardContent>
    </Card>
  );
}