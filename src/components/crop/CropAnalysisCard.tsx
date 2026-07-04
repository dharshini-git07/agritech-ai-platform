import { CropAnalysis } from "@/types/crop";
import { useLanguage } from "@/components/common/LanguageContext";

type CropAnalysisCardProps = {
  analysis: CropAnalysis;
};

export default function CropAnalysisCard({
  analysis,
}: CropAnalysisCardProps) {
  const { t } = useLanguage();

  const parseConfidenceScore = (confidenceStr: string): number => {
    if (!confidenceStr) return 0;
    const digits = confidenceStr.replace(/\D/g, "");
    if (!digits) return 0;
    const num = parseInt(digits, 10);
    if (confidenceStr.includes(".") && num < 100) {
      const floatVal = parseFloat(confidenceStr);
      if (floatVal <= 1.0) {
        return floatVal * 100;
      }
    }
    return num;
  };

  const confidenceScore = parseConfidenceScore(analysis.confidence);
  const showSuggestion = confidenceScore > 0 && confidenceScore < 70;

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

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
      <h2 className="text-3xl font-bold border-b border-gray-100 pb-4">
        {t("cropReportTitle")}
      </h2>

      {/* Overview Block */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("cropLabel")}</h3>
          <p className="font-bold text-lg text-gray-800">{analysis.crop || t("notAvailable")}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("healthLabel")}</h3>
          <p className="font-bold text-lg text-gray-800">{analysis.health || t("notAvailable")}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("diseaseLabel")}</h3>
          <p className="font-bold text-lg text-red-600">{analysis.disease || t("notAvailable")}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("severityLabel")}</h3>
          <p className="font-bold text-lg text-red-500">{analysis.severity || t("notAvailable")}</p>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Details Block */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("causeLabel")}</h3>
          <p className="text-gray-700 mt-1 text-sm">{analysis.cause || t("notAvailable")}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-500 text-sm">{t("whyOccursLabel")}</h3>
          <p className="text-gray-700 mt-1 text-sm">{analysis.whyOccurs || t("notAvailable")}</p>
        </div>
      </div>

      {/* Accordion/Collapsible sections for Lists */}
      <div className="space-y-4">
        <details className="group border border-gray-100 rounded-2xl p-4" open>
          <summary className="flex items-center justify-between cursor-pointer focus:outline-none list-none select-none">
            <h3 className="font-semibold text-gray-800">{t("symptomsLabel")}</h3>
            <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
          </summary>
          <div className="mt-3">
            {renderList(analysis.symptoms)}
          </div>
        </details>

        <details className="group border border-gray-100 rounded-2xl p-4" open>
          <summary className="flex items-center justify-between cursor-pointer focus:outline-none list-none select-none">
            <h3 className="font-semibold text-gray-800">{t("treatmentLabel")}</h3>
            <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
          </summary>
          <div className="mt-3">
            {renderList(analysis.treatment)}
          </div>
        </details>

        <details className="group border border-gray-100 rounded-2xl p-4">
          <summary className="flex items-center justify-between cursor-pointer focus:outline-none list-none select-none">
            <h3 className="font-semibold text-gray-800">{t("preventionLabel")}</h3>
            <span className="text-gray-400 group-open:rotate-180 transition-transform duration-200">▼</span>
          </summary>
          <div className="mt-3">
            {renderList(analysis.prevention)}
          </div>
        </details>
      </div>

      <hr className="border-gray-100" />

      {/* Recommendations & Timing */}
      <div className="space-y-4 text-sm">
        <div>
          <h3 className="font-semibold text-gray-500">{t("waterLabel")}</h3>
          <p className="text-gray-700 mt-1">{analysis.water || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("fertilizerLabel")}</h3>
          <p className="text-gray-700 mt-1">{analysis.fertilizer || t("notAvailable")}</p>
        </div>

        <div>
          <h3 className="font-semibold text-gray-500">{t("recoveryLabel")}</h3>
          <p className="text-gray-700 mt-1 font-medium">{analysis.recoveryTime || t("notAvailable")}</p>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* 🤖 AI Explainability Section */}
      <div className="border border-gray-100 rounded-3xl p-6 bg-gray-50 space-y-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
          {t("aiConfidenceLabel")}
        </h3>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-500">{t("confidenceLabel")}</h4>
            <p className="font-bold text-gray-800 text-base">{analysis.confidence || t("notAvailable")}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-500">📷 Image Quality</h4>
            <p className="font-bold text-gray-800 text-base">{analysis.imageQuality || t("notAvailable")}</p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-500 text-sm">{t("confidenceReasonLabel")}</h4>
          {renderList(analysis.confidenceReason)}
        </div>

        <div>
          <h4 className="font-semibold text-gray-500 text-sm">⚠️ Analysis Limitations</h4>
          <p className="text-gray-700 text-sm mt-1">{analysis.analysisLimitations || t("notAvailable")}</p>
        </div>

        {showSuggestion && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-2xl p-4 text-sm font-medium mt-2 leading-relaxed">
            💡 <strong>Suggestion:</strong> Upload a clearer image in natural daylight with the affected leaf fully visible.
          </div>
        )}
      </div>

      {/* AI Summary Block at bottom */}
      {analysis.analysisSummary && (
        <div className="bg-green-50 text-green-800 rounded-2xl p-4 text-sm font-medium border border-green-100 leading-relaxed mt-6">
          📋 <strong>{t("aiSummaryLabel")}:</strong> {analysis.analysisSummary}
        </div>
      )}
    </div>
  );
}