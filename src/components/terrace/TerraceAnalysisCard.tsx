import { Card, CardContent } from "@/components/ui/card";

export default function TerraceAnalysisCard() {
  return (
    <Card className="rounded-3xl shadow-lg">

      <CardContent className="space-y-5 p-8">

        <h2 className="text-3xl font-bold">
          🏠 Terrace Planning Report
        </h2>

        <div>
          <h3 className="font-semibold">
            Estimated Usable Area
          </h3>

          <p>Approx. 180 sq.ft</p>
        </div>

        <div>
          <h3 className="font-semibold">
            Sunlight
          </h3>

          <p>6-8 hours/day</p>
        </div>

        <div>
          <h3 className="font-semibold">
            Drainage
          </h3>

          <p>Suitable for farming.</p>
        </div>

        <div>
          <h3 className="font-semibold">
            Recommended Layout
          </h3>

          <p>Grow Bags + Hydroponic Rack</p>
        </div>

        <div>
          <h3 className="font-semibold">
            Water Tank Position
          </h3>

          <p>North-East Corner</p>
        </div>

        <div>
          <h3 className="font-semibold">
            Estimated Setup Cost
          </h3>

          <p>₹18,000 - ₹22,000</p>
        </div>

      </CardContent>

    </Card>
  );
}