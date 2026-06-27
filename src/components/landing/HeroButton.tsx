import { Button } from "@/components/ui/button";

export default function HeroButton() {
  return (
    <div className="flex gap-4 mt-8">
      <Button size="lg">
        Get Started
      </Button>

      <Button variant="outline" size="lg">
        Analyze Terrace
      </Button>
    </div>
  );
}
