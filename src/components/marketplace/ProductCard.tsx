import React from "react";
import { Product } from "@/types/marketplace";
import { useLanguage } from "@/components/common/LanguageContext";
import { Button } from "@/components/ui/button";
import { Edit, Trash, MapPin, Eye, ShoppingCart, Award, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMarketplace } from "./MarketplaceContext";

interface ProductCardProps {
  product: Product;
  isAdmin?: boolean;
  isOwner?: boolean;
  onEdit?: (product: Product) => void;
  onDelete?: (productId: string) => void;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onViewSeller?: (sellerId: string) => void;
  onApprove?: (productId: string, status: "approved" | "rejected") => void;
}

export default function ProductCard({
  product,
  isAdmin = false,
  isOwner = false,
  onEdit,
  onDelete,
  onAddToCart,
  onViewDetails,
  onViewSeller,
  onApprove,
}: ProductCardProps) {
  const { t } = useLanguage();
  const { addToCart, toggleWishlist, isInWishlist } = useMarketplace();

  const isOutOfStock = product.quantity <= 0 || product.availability === "out_of_stock";
  const favorited = isInWishlist(product.id!);

  return (
    <div className="group bg-white rounded-3xl overflow-hidden border border-gray-100 hover:border-green-200 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full">
      {/* Product Image Panel */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden shrink-0">
        <img
          src={product.images?.[0] || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80"}
          alt={product.productName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-green-800 text-xs font-bold px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
          {product.category}
        </span>

        {/* Organic Certified Overlay */}
        {product.organicCertified && (
          <span className="absolute top-3 right-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
            <Award size={13} />
            <span>Organic</span>
          </span>
        )}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-red-650 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-lg border border-red-500">
              {t("outOfStock")}
            </span>
          </div>
        )}

        {/* Wishlist Toggle Heart Button Overlay */}
        {!isOwner && !isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product.id!);
            }}
            className={`absolute bottom-3 right-3 p-2 rounded-full border shadow-md backdrop-blur-xs transition select-none cursor-pointer z-10 ${
              favorited
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-white/90 hover:bg-white border-gray-150 text-gray-500 hover:text-red-500"
            }`}
          >
            <Heart size={14} className={favorited ? "fill-red-600" : ""} />
          </button>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h4
              onClick={() => onViewDetails && onViewDetails(product)}
              className="font-bold text-gray-800 text-lg hover:text-green-600 transition cursor-pointer line-clamp-1"
            >
              {product.productName}
            </h4>
            <span className="text-xl font-extrabold text-green-750 shrink-0">
              ₹{product.price.toFixed(2)}
            </span>
          </div>

          <p className="text-gray-400 text-xs font-medium mb-3 line-clamp-1">{product.subcategory}</p>

          <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">{product.description}</p>
        </div>

        <div>
          {/* Seller / Location Info */}
          <div className="flex flex-col gap-1.5 py-3 border-t border-gray-50 text-xs text-gray-600 mb-4">
            {product.businessName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Seller:</span>
                <span
                  onClick={() => onViewSeller && onViewSeller(product.sellerId)}
                  className="font-bold text-green-600 hover:underline cursor-pointer"
                >
                  {product.businessName}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 flex items-center gap-0.5">
                <MapPin size={12} /> {t("location")}:
              </span>
              <span className="font-semibold text-gray-700 truncate max-w-[150px]">
                {product.location}
              </span>
            </div>
            {!isOutOfStock && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Stock:</span>
                <span className="font-semibold text-gray-700">
                  {product.quantity} items
                </span>
              </div>
            )}
          </div>

          {/* Owners Status Badges */}
          {(isOwner || isAdmin) && product.approvalStatus && (
            <div className="mb-4">
              <Badge
                variant={
                  product.approvalStatus === "approved"
                    ? "default"
                    : product.approvalStatus === "rejected"
                    ? "destructive"
                    : "outline"
                }
                className={`capitalize font-bold text-xs ${
                  product.approvalStatus === "approved"
                    ? "bg-green-100 text-green-800 border-green-200"
                    : product.approvalStatus === "rejected"
                    ? "bg-red-100 text-red-800 border-red-200"
                    : "bg-amber-100 text-amber-800 border-amber-200"
                }`}
              >
                {product.approvalStatus === "approved" 
                  ? t("approved") 
                  : product.approvalStatus === "rejected" 
                  ? t("rejected") 
                  : t("pendingApproval")}
              </Badge>
            </div>
          )}

          {/* Action Row */}
          <div className="flex gap-2">
            {/* Customer Add to Cart */}
            {!isOwner && !isAdmin && (
              <Button
                onClick={() => onAddToCart ? onAddToCart(product) : addToCart(product)}
                disabled={isOutOfStock}
                className="w-full bg-green-700 hover:bg-green-800 text-white rounded-xl py-2 flex items-center justify-center gap-2 font-bold transition duration-200"
              >
                <ShoppingCart size={16} />
                <span>{t("addToCart")}</span>
              </Button>
            )}

            {/* View Details Button */}
            {onViewDetails && (
              <Button
                variant="outline"
                onClick={() => onViewDetails(product)}
                className="p-2.5 rounded-xl border-gray-200 text-gray-500 hover:text-green-600 shrink-0"
              >
                <Eye size={16} />
              </Button>
            )}

            {/* Owner controls */}
            {isOwner && (
              <>
                {onEdit && (
                  <Button
                    variant="outline"
                    onClick={() => onEdit(product)}
                    className="flex-1 rounded-xl border-gray-200 text-amber-600 hover:bg-amber-50 gap-1 font-semibold"
                  >
                    <Edit size={14} />
                    <span>Edit</span>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(product.id!)}
                    className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 border-red-250 text-red-650 shrink-0"
                  >
                    <Trash size={14} />
                  </Button>
                )}
              </>
            )}

            {/* Admin approvals */}
            {isAdmin && onApprove && (
              <div className="flex gap-1.5 w-full">
                {product.approvalStatus === "pending" && (
                  <>
                    <Button
                      onClick={() => onApprove(product.id!, "approved")}
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => onApprove(product.id!, "rejected")}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      Reject
                    </Button>
                  </>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    onClick={() => onDelete(product.id!)}
                    className="p-2 rounded-xl text-red-600 hover:bg-red-50"
                  >
                    <Trash size={16} />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
