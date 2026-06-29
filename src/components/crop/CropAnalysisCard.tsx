type CropAnalysisProps = {
  analysis: any;
};

export default function CropAnalysisCard({
  analysis,
}: CropAnalysisProps) {


  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">

      <h2 className="text-3xl font-bold">
        🌱 Crop Analysis Report
      </h2>

      <div>
        <h3 className="font-semibold">Crop</h3>
        <p>{analysis.crop}</p>
      </div>

      <div>
        <h3 className="font-semibold">Plant Health</h3>
        <p>{analysis.health}</p>
      </div>

      <div>
        <h3 className="font-semibold">Disease</h3>
        <p>{analysis.disease}</p>
      </div>

      <div>
        <h3 className="font-semibold">Severity</h3>
        <p>{analysis.severity}</p>
      </div>

      <div>
        <h3 className="font-semibold">Water Recommendation</h3>
        <p>{analysis.water}</p>
      </div>

      <div>
        <h3 className="font-semibold">Fertilizer</h3>
        <p>{analysis.fertilizer}</p>
      </div>

      <div>
        <h3 className="font-semibold">Recommendation</h3>
        <p>{analysis.recommendation}</p>
      </div>

      <div>
        <h3 className="font-semibold">Confidence</h3>
        <p>{analysis.confidence}</p>
      </div>

    </div>
  );
}