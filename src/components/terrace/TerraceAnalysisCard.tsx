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

  const renderList = (items: string[]) => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return <p className="text-gray-400 text-sm">{t("notAvailable")}</p>;
    }
    return (
      <ul className="list-disc pl-5 space-y-1 mt-1 text-gray-700 text-sm">
        {items.map((item, index) => (
          <li key={index}>{item || t("notAvailable")}</li>
        ))}
      </ul>
    );
  };

  const modeColors: Record<string, string> = {
    "Image Analysis": "bg-blue-100 text-blue-800 border-blue-200",
    "Manual Planning": "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Hybrid Analysis": "bg-green-100 text-green-800 border-green-200",
  };

  const modeBadgeColor =
    modeColors[analysis.analysisMode] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <Card className="rounded-3xl shadow-lg border border-gray-100 bg-white">
      <CardContent className="space-y-6 p-8">
        <div className="flex justify-between items-center border-b border-gray-150 pb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {t("terraceReportTitle")}
          </h2>
          <span
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${modeBadgeColor}`}
          >
            🤖 {analysis.analysisMode || t("notAvailable")}
          </span>
        </div>

        {analysis.analysisSummary && (
          <div className="bg-green-50 text-green-800 rounded-2xl p-4 text-sm font-medium border border-green-100 leading-relaxed">
            📋 <strong>{t("summaryLabel")}:</strong> {analysis.analysisSummary}
          </div>
        )}

        {/* Spatial Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">
              {t("terraceAreaLabel")}
            </h3>
            <p className="font-bold text-lg text-gray-850 mt-1">
              {analysis.terraceArea || t("notAvailable")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">
              {t("usableAreaLabel")}
            </h3>
            <p className="font-bold text-lg text-gray-850 mt-1">
              {analysis.usableArea || t("notAvailable")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">
              {t("growBagCountLabel")}
            </h3>
            <p className="font-bold text-lg text-gray-850 mt-1">
              {analysis.growBagCount || t("notAvailable")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-400 text-xs uppercase tracking-wider">
              {t("waterTankPlacementLabel")}
            </h3>
            <p className="font-bold text-base text-gray-850 mt-1 leading-tight">
              {analysis.waterTankPlacement || t("notAvailable")}
            </p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Environmental Assessment */}
        <div className="grid md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="font-semibold text-gray-500">{t("sunlightLabel")}</h3>
            <p className="text-gray-700 mt-1">{analysis.sunlight || t("notAvailable")}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-500">{t("drainageLabel")}</h3>
            <p className="text-gray-700 mt-1">{analysis.drainage || t("notAvailable")}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-500">
              {t("hydroponicsSuitabilityLabel")}
            </h3>
            <p className="text-gray-700 mt-1">
              {analysis.hydroponicsSuitability || t("notAvailable")}
            </p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Layout Plan */}
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("layoutLabel")}</h3>
          <p className="text-gray-750 text-sm mt-1 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
            {analysis.layout || t("notAvailable")}
          </p>
        </div>

        {/* Recommended Crops Badges */}
        <div>
          <h3 className="font-semibold text-gray-500 text-sm mb-2">
            {t("recommendedCropsLabel")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.recommendedCrops && analysis.recommendedCrops.length > 0 ? (
              analysis.recommendedCrops.map((crop, index) => (
                <span
                  key={index}
                  className="bg-green-50 text-green-700 border border-green-200 text-xs px-3.5 py-1.5 rounded-full font-semibold shadow-sm hover:bg-green-100 transition cursor-default"
                >
                  {crop}
                </span>
              ))
            ) : (
              <span className="text-gray-400 text-sm">{t("notAvailable")}</span>
            )}
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Collapsible Action lists */}
        <div className="space-y-4">
          <details className="group border border-gray-100 rounded-2xl p-4" open>
            <summary className="flex items-center justify-between cursor-pointer focus:outline-none list-none select-none">
              <h3 className="font-semibold text-gray-800 text-sm">
                📋 {t("shoppingRecommendationsLabel")}
              </h3>
              <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform duration-200">
                ▼
              </span>
            </summary>
            <div className="mt-3">
              {renderList(analysis.shoppingRecommendations)}
            </div>
          </details>

          <details className="group border border-gray-100 rounded-2xl p-4">
            <summary className="flex items-center justify-between cursor-pointer focus:outline-none list-none select-none">
              <h3 className="font-semibold text-gray-800 text-sm">
                🛠️ {t("maintenanceTipsLabel")}
              </h3>
              <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform duration-200">
                ▼
              </span>
            </summary>
            <div className="mt-3">{renderList(analysis.maintenanceTips)}</div>
          </details>

          <details className="group border border-gray-100 rounded-2xl p-4">
            <summary className="flex items-center justify-between cursor-pointer focus:outline-none list-none select-none">
              <h3 className="font-semibold text-gray-800 text-sm">
                🎯 {t("confidenceReasonLabel")}
              </h3>
              <span className="text-gray-400 text-xs group-open:rotate-180 transition-transform duration-200">
                ▼
              </span>
            </summary>
            <div className="mt-3">{renderList(analysis.confidenceReason)}</div>
          </details>
        </div>

        <hr className="border-gray-100" />

        {/* Bottom Metadata */}
        <div className="flex justify-between items-center text-sm font-medium pt-2">
          <div>
            <span className="text-gray-400">{t("estimatedCostLabel")}: </span>
            <span className="text-green-700 font-bold text-lg">
              {analysis.estimatedCost || t("notAvailable")}
            </span>
          </div>

          <div>
            <span className="text-gray-400">{t("confidenceLabel")}: </span>
            <span className="text-gray-800 font-bold">
              {analysis.confidence || t("notAvailable")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}