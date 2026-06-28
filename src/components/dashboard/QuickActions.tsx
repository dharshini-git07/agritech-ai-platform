import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">

      <h2 className="text-xl font-bold mb-5">
        Quick Actions
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <Link href="/dashboard/terrace">
          <Button className="w-full">📤 Upload</Button>
        </Link>

        <Link href="/dashboard/recommendation">
          <Button className="w-full">🤖 Analyze</Button>
        </Link>

        <Link href="/dashboard/hydroponics">
          <Button className="w-full">💧 Hydroponics</Button>
        </Link>

        <Link href="/marketplace">
          <Button className="w-full">🛒 Marketplace</Button>
        </Link>

      </div>

    </div>
  );
}