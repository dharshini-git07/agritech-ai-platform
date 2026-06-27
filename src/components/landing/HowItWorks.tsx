import StepCard from "./StepCard";

import {
  Upload,
  ScanSearch,
  Sprout,
  Leaf,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto py-24 px-8">

      <div className="text-center mb-16">

        <h2 className="text-4xl font-bold">
          How It Works
        </h2>

        <p className="text-gray-600 mt-4">
          Four simple steps to start your AI-powered terrace farming journey.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        <StepCard
          step="01"
          icon={Upload}
          title="Upload Terrace"
          description="Upload a terrace image or enter measurements."
        />

        <StepCard
          step="02"
          icon={ScanSearch}
          title="AI Analysis"
          description="AI measures your terrace and detects usable space."
        />

        <StepCard
          step="03"
          icon={Sprout}
          title="Smart Recommendation"
          description="Receive crop, soil and hydroponic suggestions."
        />

        <StepCard
          step="04"
          icon={Leaf}
          title="Start Farming"
          description="Follow the AI plan and monitor your smart farm."
        />

      </div>

    </section>
  );
}