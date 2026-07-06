import React, { useState } from "react";
import { RecoveryKit } from "@/types/recoveryKit";
import { useMarketplace } from "@/components/marketplace/MarketplaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Calendar,
  ArrowRight,
  Plus
} from "lucide-react";

interface AiCropRecoveryKitProps {
  recoveryKit: RecoveryKit;
}

export default function AiCropRecoveryKit({ recoveryKit }: AiCropRecoveryKitProps) {
  const { products: marketplaceProducts, addMultipleToCart, addToCart } = useMarketplace();
  const [isAddingAll, setIsAddingAll] = useState(false);
  const [addingIndividualId, setAddingIndividualId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddAllToCart = async () => {
    setIsAddingAll(true);
    setSuccessMessage(null);
    try {
      const itemsToAdd = recoveryKit.recommendations
        .filter((r) => r.isAvailable && r.productId)
        .map((r) => {
          const matchedProd = marketplaceProducts.find((p) => p.id === r.productId);
          if (!matchedProd) return null;
          return {
            product: matchedProd,
            quantity: r.quantity,
          };
        })
        .filter(Boolean) as { product: any; quantity: number }[];

      if (itemsToAdd.length === 0) {
        alert("No products in the recovery kit are currently available to buy.");
        return;
      }

      await addMultipleToCart(itemsToAdd);
      setSuccessMessage("All available products from your AI Crop Recovery Kit have been added to your cart!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to add recovery kit to cart:", err);
      alert("Error adding products to cart. Please try again.");
    } finally {
      setIsAddingAll(false);
    }
  };

  const handleAddIndividual = async (productId: string) => {
    setAddingIndividualId(productId);
    try {
      const matchedProd = marketplaceProducts.find((p) => p.id === productId);
      if (matchedProd) {
        await addToCart(matchedProd);
      }
    } catch (err) {
      console.error("Error adding product to cart:", err);
    } finally {
      setAddingIndividualId(null);
    }
  };

  const availableItems = recoveryKit.recommendations.filter((r) => r.isAvailable);

  return (
    <div className="space-y-8 mt-10">
      <Card className="rounded-3xl shadow-lg border border-gray-100 bg-white overflow-hidden transition-all duration-300 hover:shadow-xl">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-150 pb-5 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                🌿 AI Crop Recovery Kit
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Organic, eco-friendly products matched to resolve your crop's detected issues.
              </p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shrink-0">
              <Leaf size={13} className="animate-pulse text-emerald-600" />
              <span>100% Organic & Eco-Friendly</span>
            </span>
          </div>

          {/* Success message */}
          {successMessage && (
            <div className="bg-emerald-50 text-emerald-800 rounded-2xl p-4 text-sm font-semibold border border-emerald-100 flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Product Recommendations */}
          <div className="space-y-4">
            {recoveryKit.recommendations.map((rec, index) => {
              return (
                <div
                  key={index}
                  className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                    rec.isAvailable
                      ? "bg-white hover:bg-emerald-50/10 border-gray-100 hover:border-emerald-200"
                      : "bg-gray-50/50 border-gray-150"
                  }`}
                >
                  <div className="space-y-2 max-w-2xl flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className={`font-bold text-base ${rec.isAvailable ? "text-gray-800" : "text-gray-400"}`}>
                        {rec.productName}
                      </h4>
                      <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {rec.category}
                      </span>
                      {rec.organicCertified && (
                        <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <Leaf size={10} className="fill-white" />
                          Organic
                        </span>
                      )}
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Qty: {rec.quantity}
                      </span>
                      <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                        <Sparkles size={10} />
                        Suitability: {rec.suitabilityScore}%
                      </span>
                    </div>

                    <p className="text-gray-500 text-sm leading-relaxed">{rec.whyThisProduct}</p>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 gap-2.5 border-gray-100">
                    {rec.isAvailable && rec.productId ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-gray-400 text-[10px] block font-medium">Estimated Price</span>
                          <span className="text-lg font-extrabold text-green-750">
                            ₹{rec.estimatedPrice.toFixed(2)}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          disabled={addingIndividualId === rec.productId}
                          onClick={() => handleAddIndividual(rec.productId!)}
                          className="rounded-xl border-gray-200 text-gray-500 hover:text-green-600"
                        >
                          {addingIndividualId === rec.productId ? (
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Plus size={16} />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-xs bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl w-full justify-center md:w-auto">
                        <AlertTriangle size={14} className="shrink-0" />
                        <span>Currently unavailable in Namma Kadai.</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline Section */}
          <div className="pt-6 border-t border-gray-150 space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar size={18} className="text-green-700" />
              <span>Plant Recovery Schedule</span>
            </h3>

            <div className="relative pl-6 border-l-2 border-emerald-100 space-y-6 ml-3">
              {recoveryKit.timeline.map((entry, index) => (
                <div key={index} className="relative">
                  {/* Bullet */}
                  <span className="absolute -left-[31px] top-1 bg-emerald-600 text-white rounded-full p-1 text-[10px] font-bold w-5 h-5 flex items-center justify-center border-4 border-white shadow-xs">
                    {index + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                      <span className="text-emerald-700">{entry.day}:</span>
                      <span>{entry.title}</span>
                    </h4>
                    <ul className="mt-2 list-disc pl-5 text-xs text-gray-500 space-y-1">
                      {entry.actions.map((act, aIdx) => (
                        <li key={aIdx}>{act}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Card */}
          <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-100">
                <ShoppingCart className="text-green-700" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                  Estimated Recovery Cost
                </p>
                <p className="text-2xl font-extrabold text-gray-800 mt-0.5">
                  ₹{recoveryKit.estimatedTotalCost.toFixed(2)}
                </p>
              </div>
            </div>

            <Button
              onClick={handleAddAllToCart}
              disabled={isAddingAll || availableItems.length === 0}
              className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white rounded-xl py-6 px-8 flex items-center justify-center gap-2 font-bold transition duration-200 shadow-md hover:shadow-lg text-base cursor-pointer"
            >
              {isAddingAll ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Adding to Cart...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={18} />
                  <span>Add Entire Recovery Kit to Cart</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
