import React from "react";
import { OrderStatus } from "@/types/order";
import { Check, AlertTriangle, Clock, Package, Truck, Compass, CheckSquare } from "lucide-react";

interface OrderTimelineProps {
  status: OrderStatus;
}

export default function OrderTimeline({ status }: OrderTimelineProps) {
  const steps: { name: OrderStatus; label: string; icon: any }[] = [
    { name: "Pending", label: "Pending Approval", icon: Clock },
    { name: "Confirmed", label: "Order Confirmed", icon: Check },
    { name: "Packed", label: "Packed & Ready", icon: Package },
    { name: "Shipped", label: "Shipped out", icon: Truck },
    { name: "Out for Delivery", label: "Out for Delivery", icon: Compass },
    { name: "Delivered", label: "Delivered", icon: CheckSquare },
  ];

  if (status === "Cancelled") {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
        <AlertTriangle className="shrink-0 animate-bounce" size={20} />
        <div>
          <h4 className="font-bold text-sm">Order Cancelled</h4>
          <p className="text-xs mt-0.5 opacity-90">This order has been cancelled and the product stocks have been restored to the inventory.</p>
        </div>
      </div>
    );
  }

  const activeIndex = steps.findIndex((step) => step.name === status);

  return (
    <div className="py-6 px-4">
      {/* Horizontal timeline for medium+ screens */}
      <div className="relative hidden sm:flex justify-between items-center w-full max-w-2xl mx-auto">
        {/* Connecting line background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 z-0 rounded-full" />
        
        {/* Connecting line progress */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-green-600 z-0 rounded-full transition-all duration-500" 
          style={{ width: `${(activeIndex / (steps.length - 1)) * 100}%` }}
        />

        {/* Timeline nodes */}
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isUpcoming = idx > activeIndex;

          return (
            <div key={step.name} className="relative z-10 flex flex-col items-center gap-2">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm ${
                  isCompleted 
                    ? "bg-green-600 border-green-600 text-white" 
                    : isActive 
                    ? "bg-white border-green-650 text-green-700 font-extrabold ring-4 ring-green-100 animate-pulse" 
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                <StepIcon size={14} />
              </div>
              
              <span 
                className={`text-[9px] font-bold absolute top-10 whitespace-nowrap text-center transition-colors duration-300 ${
                  isActive ? "text-green-700 font-black" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="hidden sm:block h-4" /> {/* spacer for labels */}

      {/* Vertical timeline for mobile screens */}
      <div className="sm:hidden flex flex-col gap-4 pl-4 border-l-2 border-gray-200 ml-2 relative">
        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isUpcoming = idx > activeIndex;

          return (
            <div key={step.name} className="flex items-center gap-3 relative">
              {/* Vertical connecting line indicator for active/completed */}
              {isActive && (
                <div className="absolute -left-[21px] top-3.5 bottom-0 w-0.5 bg-gray-200" />
              )}
              <div 
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 z-10 shrink-0 ${
                  isCompleted 
                    ? "bg-green-600 border-green-600 text-white animate-none" 
                    : isActive 
                    ? "bg-white border-green-650 text-green-700 font-extrabold ring-4 ring-green-100" 
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                <StepIcon size={12} />
              </div>
              <span className={`text-xs font-semibold ${isActive ? "text-green-700 font-black" : isCompleted ? "text-gray-700" : "text-gray-450"}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
