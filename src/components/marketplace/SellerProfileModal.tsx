import React, { useState, useEffect } from "react";
import { SellerProfile, Product } from "@/types/marketplace";
import { getSellerProfile, getProducts } from "@/services/marketplaceService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, MapPin, Phone, Star, Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SellerProfileModalProps {
  sellerId: string;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
  onViewProductDetails?: (product: Product) => void;
}

export default function SellerProfileModal({
  sellerId,
  onClose,
  onAddToCart,
  onViewProductDetails,
}: SellerProfileModalProps) {
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [name, setName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSellerDetails() {
      if (!sellerId) return;
      setLoading(true);
      try {
        // Load seller business profile
        const prof = await getSellerProfile(sellerId);
        setProfile(prof);

        // Load farmer name
        const userDoc = await getDoc(doc(db, "users", sellerId));
        if (userDoc.exists()) {
          setName(userDoc.data().name || "Farmer");
        }

        // Load approved products
        const list = await getProducts({ sellerId, status: "approved" });
        setProducts(list);
      } catch (err) {
        console.error("Error loading seller modal details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSellerDetails();
  }, [sellerId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-150 relative">
        
        {/* Header / Dismiss */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-800 transition z-10 cursor-pointer"
        >
          <X size={20} />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20 text-gray-500 font-medium">
            Loading seller profile details...
          </div>
        ) : !profile ? (
          <div className="flex-1 flex items-center justify-center py-20 text-red-500 font-bold">
            Seller profile not found.
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Banner/Profile Info */}
            <div className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-150">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="p-4 bg-white rounded-3xl text-green-700 shadow-md border border-green-100">
                  <Store size={48} />
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-3xl font-extrabold text-gray-800">
                      {profile.businessName}
                    </h3>
                    <span className="bg-green-700 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                      {profile.sellerType}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm italic max-w-2xl">
                    "{profile.description}"
                  </p>

                  <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 font-medium pt-2">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} className="text-green-600" />
                      <span>{profile.address}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone size={16} className="text-green-600" />
                      <span>{profile.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-amber-500 fill-amber-500" />
                      <span className="text-gray-800 font-bold">{profile.rating.toFixed(1)} Rating</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Managed by: {name}</p>
                </div>
              </div>
            </div>

            {/* Product Listing */}
            <div className="p-8 flex-1">
              <h4 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Package size={20} className="text-green-700" />
                <span>Listed Products ({products.length})</span>
              </h4>

              {products.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl text-gray-400 border border-dashed border-gray-200">
                  This seller hasn't listed any active products yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-100 rounded-2xl overflow-hidden hover:shadow-lg transition">
                      <img
                        src={product.images?.[0] || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80"}
                        alt={product.productName}
                        className="w-full aspect-[4/3] object-cover"
                      />
                      <div className="p-4 space-y-2 bg-white">
                        <div className="flex justify-between items-center gap-2">
                          <span
                            onClick={() => onViewProductDetails && onViewProductDetails(product)}
                            className="font-bold text-gray-850 hover:text-green-600 cursor-pointer truncate text-sm flex-1"
                          >
                            {product.productName}
                          </span>
                          <span className="font-extrabold text-green-750 text-sm">
                            ₹{product.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-1">{product.subcategory}</p>

                        <div className="flex gap-2 pt-2 border-t border-gray-50">
                          {onViewProductDetails && (
                            <Button
                              variant="outline"
                              onClick={() => onViewProductDetails(product)}
                              className="w-full text-xs font-semibold py-1 rounded-lg border-gray-200"
                            >
                              Details
                            </Button>
                          )}
                          {onAddToCart && (
                            <Button
                              onClick={() => onAddToCart(product)}
                              className="w-full text-xs font-bold py-1 rounded-lg bg-green-700 hover:bg-green-800 text-white"
                            >
                              Add to Cart
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-3 shrink-0">
          <Button
            onClick={onClose}
            className="px-6 py-2 bg-white hover:bg-gray-100 border border-gray-250 text-gray-700 font-bold rounded-xl"
          >
            Close Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
