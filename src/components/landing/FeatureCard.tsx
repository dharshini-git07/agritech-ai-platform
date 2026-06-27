import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <Card className="group rounded-2xl border hover:shadow-xl hover:-translate-y-2 transition-all duration-300 cursor-pointer">
      <CardContent className="p-8 text-center">

        <div className="flex justify-center mb-5">
          <div className="rounded-full bg-green-100 p-4 group-hover:bg-green-600 transition">
            <Icon
              size={36}
              className="text-green-600 group-hover:text-white transition"
            />
          </div>
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