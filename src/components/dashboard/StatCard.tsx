import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  icon: LucideIcon;
};

export default function StatCard({
  title,
  value,
  icon: Icon,
}: StatCardProps) {
  return (
    <Card className="rounded-2xl shadow-md hover:shadow-xl transition">
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-500">{title}</p>
          <h2 className="text-3xl font-bold mt-2">{value}</h2>
        </div>

        <Icon size={40} className="text-green-600" />
      </CardContent>
    </Card>
  );
}