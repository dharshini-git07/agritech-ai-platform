import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Link href="/dashboard/crop-analysis">
          <Button className="w-full">
            🌱 Crop Health Analysis
          </Button>
        </Link>

        <Link href="/dashboard/hydroponics">
          <Button className="w-full">
            💧 Hydroponics
          </Button>
        </Link>

        <Link href="/marketplace">
          <Button className="w-full">
            🛒 Marketplace
          </Button>
        </Link>

        <Link href="/dashboard/reports">
          <Button className="w-full">
            📊 Reports
          </Button>
        </Link>

      </div>

    </div>
  );
}