import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type StepCardProps = {
  step: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: StepCardProps) {
  return (
    <Card className="rounded-2xl text-center hover:shadow-xl transition-all duration-300">
      <CardContent className="p-8">

        <div className="text-green-600 font-bold text-lg mb-4">
          {step}
        </div>

        <div className="flex justify-center mb-5">
          <Icon size={40} className="text-green-600" />
        </div>

        <h3 className="text-xl font-semibold mb-3">
          {title}
        </h3>

        <p className="text-gray-600">
          {description}
        </p>

      </CardContent>
    </Card>
  );
}