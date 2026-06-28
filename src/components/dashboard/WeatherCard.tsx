import { Card, CardContent } from "@/components/ui/card";
import { CloudSun, Droplets, Wind } from "lucide-react";

export default function WeatherCard() {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-6">
          Today's Weather
        </h2>

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-4xl font-bold">
              31°C
            </h3>

            <p className="text-gray-500 mt-2">
              Chennai
            </p>
          </div>

          <CloudSun size={60} className="text-yellow-500" />

        </div>

        <div className="grid grid-cols-2 gap-4 mt-8">

          <div className="flex items-center gap-3">
            <Droplets className="text-blue-500" />
            <span>Humidity 70%</span>
          </div>

          <div className="flex items-center gap-3">
            <Wind className="text-green-600" />
            <span>15 km/h</span>
          </div>

        </div>

      </CardContent>
    </Card>
  );
}