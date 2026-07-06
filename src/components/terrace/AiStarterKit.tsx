import React, { useState } from "react";
import { StarterKit } from "@/types/starterKit";
import { useLanguage } from "@/components/common/LanguageContext";
import { useMarketplace } from "@/components/marketplace/MarketplaceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ShoppingCart, CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

interface AiStarterKitProps {
  starterKit: StarterKit;
}

export default function AiStarterKit({ starterKit }: AiStarterKitProps) {
  const { t } = useLanguage();
  const { products: marketplaceProducts, addMultipleToCart } = useMarketplace();
  const [isAdding, setIsAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleAddAllToCart = async () => {
    setIsAdding(true);
    setSuccessMessage(null);
    try {
      const itemsToAdd = starterKit.recommendations
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
        alert("No products in the starter kit are currently available in the marketplace.");
        return;
      }

      await addMultipleToCart(itemsToAdd);
      setSuccessMessage(t("addedToCartSuccess") || "All available products from your AI Starter Kit have been added to your cart!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Failed to add starter kit to cart:", err);
      alert("Something went wrong while adding products to your cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const availableItems = starterKit.recommendations.filter((r) => r.isAvailable);
  const unavailableItems = starterKit.recommendations.filter((r) => !r.isAvailable);

  return (
    <Card className="rounded-3xl shadow-lg border border-gray-100 bg-white overflow-hidden mt-8 transition-all duration-300 hover:shadow-xl">
      <CardContent className="p-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-150 pb-5 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              {t("starterKitTitle") || "🌱 AI Starter Kit"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("starterKitDesc") || "Recommended marketplace items based on your terrace analysis configuration."}
            </p>
          </div>
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm shrink-0">
            <Sparkles size={13} className="animate-pulse" />
            <span>AI Optimized</span>
          </span>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 rounded-2xl p-4 text-sm font-semibold border border-emerald-100 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="text-emerald-600 shrink-0" size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Recommendations List */}
        <div className="space-y-4">
          {starterKit.recommendations.map((recommendation, index) => {
            const isAvailable = recommendation.isAvailable;

            return (
              <div
                key={index}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                  isAvailable
                    ? "bg-white hover:bg-green-50/10 border-gray-100 hover:border-green-200"
                    : "bg-gray-50/50 border-gray-150"
                }`}
              >
                {/* Item Details */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={`font-bold text-base ${isAvailable ? "text-gray-800" : "text-gray-400"}`}>
                      {recommendation.productName}
                    </h4>
                    <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {recommendation.category}
                    </span>
                    <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Qty: {recommendation.quantity}
                    </span>
                    <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Sparkles size={10} />
                      {t("suitabilityScoreLabel") || "Suitability"}: {recommendation.suitabilityScore}%
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{recommendation.reason}</p>
                </div>

                {/* Price and Action Status */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 gap-2 border-gray-100">
                  {isAvailable ? (
                    <>
                      <span className="text-gray-400 text-xs font-medium">Estimated Price</span>
                      <span className="text-xl font-extrabold text-green-750">
                        ₹{recommendation.estimatedPrice.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-amber-600 font-semibold text-xs bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl w-full justify-center md:w-auto">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{t("productUnavailable") || "Recommended product currently unavailable."}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary / CTA */}
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-xl shadow-xs border border-gray-100">
              <ShoppingCart className="text-green-700" size={24} />
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase font-bold tracking-wider">
                {t("estimatedTotalCostLabel") || "Estimated Total Cost"}
              </p>
              <p className="text-2xl font-extrabold text-gray-800 mt-0.5">
                ₹{starterKit.estimatedTotalCost.toFixed(2)}
              </p>
            </div>
          </div>

          <Button
            onClick={handleAddAllToCart}
            disabled={isAdding || availableItems.length === 0}
            className="w-full md:w-auto bg-green-700 hover:bg-green-800 text-white rounded-xl py-6 px-8 flex items-center justify-center gap-2 font-bold transition duration-200 shadow-md hover:shadow-lg text-base cursor-pointer"
          >
            {isAdding ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Adding to Cart...</span>
              </>
            ) : (
              <>
                <ShoppingCart size={18} />
                <span>{t("addStarterKitToCart") || "Add Entire Starter Kit to Cart"}</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
