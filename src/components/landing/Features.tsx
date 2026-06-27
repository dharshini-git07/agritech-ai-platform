import FeatureCard from "./FeatureCard";

import {
  Sprout,
  Droplets,
  Wifi,
  ShoppingCart,
} from "lucide-react";

export default function Features() {
  return (
    <section className="max-w-7xl mx-auto py-24 px-8">

      <div className="text-center mb-16">

        <h2 className="text-4xl font-bold">
          Why Choose AgriTech AI?
        </h2>

        <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
          Experience intelligent farming powered by AI,
          IoT, Hydroponics and direct farm-to-customer
          connectivity.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

        <FeatureCard
          icon={Sprout}
          title="AI Terrace Analysis"
          description="Analyze terrace dimensions using AI-powered computer vision."
        />

        <FeatureCard
          icon={Droplets}
          title="Smart Hydroponics"
          description="Monitor pH, nutrients and water quality in real time."
        />

        <FeatureCard
          icon={Wifi}
          title="IoT Monitoring"
          description="Track soil moisture, humidity and temperature."
        />

        <FeatureCard
          icon={ShoppingCart}
          title="Namma Kadai"
          description="Sell fresh produce directly to customers."
        />

      </div>

    </section>
  );
}