import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

type RoleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
};

export default function RoleCard({
  icon: Icon,
  title,
  description,
  href,
}: RoleCardProps) {
  return (
    <Card className="rounded-3xl hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
      <CardContent className="p-8 text-center">

        <div className="flex justify-center mb-5">
          <Icon size={50} className="text-green-600" />
        </div>

        <h2 className="text-2xl font-bold mb-3">
          {title}
        </h2>

        <p className="text-gray-600 mb-8">
          {description}
        </p>

        <Link href={href}>
          <Button className="w-full">
            Continue
          </Button>
        </Link>

      </CardContent>
    </Card>
  );
}