import { Card, CardContent } from "@/components/ui/card";
import { Bot, BrainCircuit, Camera, MessageSquare } from "lucide-react";

export default function AISection() {
  return (
    <section className="bg-green-50 py-24 px-8">

      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {/* Left Side */}

        <div>

          <span className="bg-green-200 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
            🤖 Agentic AI
          </span>

          <h2 className="text-5xl font-bold mt-6">
            Meet Your
            <span className="text-green-600"> AI Farming Assistant</span>
          </h2>

          <p className="text-gray-600 mt-6 text-lg leading-8">
            Our intelligent AI Agent helps farmers analyze terrace spaces,
            recommend crops, monitor hydroponics, answer farming questions,
            and provide real-time insights for smarter farming decisions.
          </p>

        </div>

        {/* Right Side */}

        <Card className="rounded-3xl shadow-xl">

          <CardContent className="p-10 space-y-6">

            <div className="flex items-center gap-4">
              <Bot className="text-green-600" />
              AI Crop Recommendation
            </div>

            <div className="flex items-center gap-4">
              <Camera className="text-green-600" />
              Terrace Image Analysis
            </div>

            <div className="flex items-center gap-4">
              <BrainCircuit className="text-green-600" />
              Smart Decision Support
            </div>

            <div className="flex items-center gap-4">
              <MessageSquare className="text-green-600" />
              AI Chat Assistant
            </div>

          </CardContent>

        </Card>

      </div>

    </section>
  );
}