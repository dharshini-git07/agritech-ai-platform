import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Upload,
  Brain,
  ShoppingCart,
} from "lucide-react";

const activities = [
  {
    icon: Upload,
    text: "Terrace image uploaded",
  },
  {
    icon: Brain,
    text: "AI generated crop recommendation",
  },
  {
    icon: ShoppingCart,
    text: "Marketplace order placed",
  },
  {
    icon: CheckCircle2,
    text: "Hydroponics system checked",
  },
];

export default function RecentActivity() {
  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-6">

        <h2 className="text-xl font-bold mb-6">
          Recent Activity
        </h2>

        <div className="space-y-5">

          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <div
                key={index}
                className="flex items-center gap-4"
              >
                <Icon
                  className="text-green-600"
                  size={22}
                />

                <p>{activity.text}</p>

              </div>
            );
          })}

        </div>

      </CardContent>
    </Card>
  );
}