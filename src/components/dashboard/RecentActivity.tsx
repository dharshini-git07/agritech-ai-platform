"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Upload,
  Brain,
  ShoppingCart,
} from "lucide-react";
import { useLanguage } from "@/components/common/LanguageContext";

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
  const { t } = useLanguage();

  const getTranslatedActivity = (text: string) => {
    if (text === "Terrace image uploaded") return t("activityTerraceImage");
    if (text === "AI generated crop recommendation") return t("activityCropRec");
    if (text === "Marketplace order placed") return t("activityMarketOrder");
    if (text === "Hydroponics system checked") return t("activityHydroponicsCheck");
    return text;
  };

  return (
    <Card className="rounded-2xl shadow-md">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold mb-6">{t("recentActivity")}</h2>

        <div className="space-y-5">
          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <div key={index} className="flex items-center gap-4">
                <Icon className="text-green-600" size={22} />
                <p>{getTranslatedActivity(activity.text)}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}