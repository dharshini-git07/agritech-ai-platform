import React from "react";
import { Product } from "@/types/marketplace";
import { useMarketplace } from "./MarketplaceContext";
import { useLanguage } from "@/components/common/LanguageContext";
import { X, Award, MapPin, Store, CreditCard, ShoppingCart, Heart, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductDetailProps {
  product: Product;
  onClose: () => void;
  onViewSeller?: (sellerId: string) => void;
}

export default function ProductDetail({ product, onClose, onViewSeller }: ProductDetailProps) {
  const { t } = useLanguage();
  const { addToCart, toggleWishlist, isInWishlist } = useMarketplace();

  const isOutOfStock = product.quantity <= 0 || product.availability === "out_of_stock";
  const favorited = isInWishlist(product.id!);

  const handleBuyNow = () => {
    alert("Buy Now (Placeholder): Order details generated. The seller will contact you for payment.");
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Click backdrop to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-150 p-8 animate-in zoom-in-95 duration-250 flex flex-col justify-between">
        
        {/* Dismiss Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            {/* Image section */}
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
              <img
                src={product.images?.[0]}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
              
              {/* Category Badge overlay */}
              <span className="absolute top-3 left-3 bg-white/95 text-green-800 text-[10px] font-bold px-2.5 py-1 rounded-full border shadow-xs">
                {product.category}
              </span>

              {/* Organic certified indicator */}
              {product.organicCertified && (
                <span className="absolute top-3 right-3 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-0.5 shadow-sm">
                  <Award size={11} />
                  <span>Organic</span>
                </span>
              )}

              {/* Out of Stock overlay */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="bg-red-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg">
                    {t("outOfStock")}
                  </span>
                </div>
              )}
            </div>

            {/* Title / Pricing details */}
            <div className="flex flex-col justify-between py-1">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">
                  {product.subcategory}
                </span>
                
                <h3 className="text-2xl font-extrabold text-gray-800 leading-tight">
                  {product.productName}
                </h3>

                <p className="text-green-700 font-extrabold text-3xl">
                  ₹{product.price.toFixed(2)}
                </p>
              </div>

              {/* Specification table */}
              <div className="border-t border-gray-100 pt-3 text-xs space-y-2.5 text-gray-650 font-medium">
                {product.businessName && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-450 flex items-center gap-1">
                      <Store size={13} /> Seller:
                    </span>
                    <span
                      onClick={() => {
                        if (onViewSeller) onViewSeller(product.sellerId);
                        onClose();
                      }}
                      className="font-bold text-green-600 hover:underline cursor-pointer"
                    >
                      {product.businessName} ({product.sellerType})
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-455 flex items-center gap-1">
                    <MapPin size={13} /> Location:
                  </span>
                  <span className="text-gray-850 font-bold">{product.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-455">Available Stock:</span>
                  <span className={`font-bold ${isOutOfStock ? "text-red-500" : "text-gray-800"}`}>
                    {isOutOfStock ? "0 units" : `${product.quantity} units`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-455">Status:</span>
                  <span className="text-gray-800 font-semibold flex items-center gap-1">
                    <ShieldCheck size={13} className="text-green-600" />
                    <span>Safe trade guarantee</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Description section */}
          <div>
            <h4 className="font-bold text-gray-800 text-sm mb-1.5">Product Description</h4>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
              {product.description}
            </p>
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={() => toggleWishlist(product.id!)}
            className={`flex-1 py-3 rounded-xl border-gray-250 font-bold flex items-center justify-center gap-2 transition duration-200 ${
              favorited 
                ? "bg-red-50 border-red-200 text-red-650 hover:bg-red-100" 
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Heart size={16} className={favorited ? "fill-red-600 text-red-600" : ""} />
            <span>{favorited ? "In Wishlist" : "Wishlist"}</span>
          </Button>

          <Button
            onClick={() => addToCart(product)}
            disabled={isOutOfStock}
            className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold flex items-center justify-center gap-2"
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </Button>

          <Button
            onClick={handleBuyNow}
            disabled={isOutOfStock}
            className="flex-1 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            <span>Buy Now</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
