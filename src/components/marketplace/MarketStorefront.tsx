import React, { useState } from "react";
import { Product } from "@/types/marketplace";
import { useMarketplace } from "./MarketplaceContext";
import ProductCard from "./ProductCard";
import ProductFilter, { FilterValues } from "./ProductFilter";
import ProductDetail from "./ProductDetail";
import SellerProfileModal from "./SellerProfileModal";
import { useLanguage } from "@/components/common/LanguageContext";
import { Sparkles, Award, Truck, ShieldCheck, ShoppingBag } from "lucide-react";

export default function MarketStorefront() {
  const { t } = useLanguage();
  const { products, loadingProducts, addToCart } = useMarketplace();

  // Active product details or seller profile modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterValues>({
    search: "",
    category: "All",
    subcategory: "All",
    sellerType: "All",
    location: "All",
    minPrice: null,
    maxPrice: null,
    organicOnly: false,
    sortBy: "newest",
  });

  // Unique locations from active products catalog
  const uniqueLocations = Array.from(
    new Set(products.map((p) => p.location).filter(Boolean))
  );

  // Apply filters client-side
  let filteredProducts = products.filter((product) => {
    // 1. Category Filter
    if (filters.category !== "All" && product.category !== filters.category) {
      return false;
    }
    // 2. Subcategory Filter
    if (filters.subcategory !== "All" && product.subcategory !== filters.subcategory) {
      return false;
    }
    // 3. Seller Type Filter
    if (filters.sellerType !== "All" && product.sellerType !== filters.sellerType) {
      return false;
    }
    // 4. Dynamic Location Filter
    if (filters.location !== "All" && product.location !== filters.location) {
      return false;
    }
    // 5. Min Price
    if (filters.minPrice !== null && product.price < filters.minPrice) {
      return false;
    }
    // 6. Max Price
    if (filters.maxPrice !== null && product.price > filters.maxPrice) {
      return false;
    }
    // 7. Organic Certified Filter
    if (filters.organicOnly && !product.organicCertified) {
      return false;
    }
    // 8. Search query match
    if (filters.search.trim() !== "") {
      const q = filters.search.toLowerCase();
      const matchName = product.productName.toLowerCase().includes(q);
      const matchCat = product.category.toLowerCase().includes(q);
      const matchSub = product.subcategory.toLowerCase().includes(q);
      const matchSeller = product.businessName?.toLowerCase().includes(q);
      if (!matchName && !matchCat && !matchSub && !matchSeller) {
        return false;
      }
    }
    return true;
  });

  // Sort products
  filteredProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === "price_asc") {
      return a.price - b.price;
    }
    if (filters.sortBy === "price_desc") {
      return b.price - a.price;
    }
    if (filters.sortBy === "popular") {
      // Mock popularity by comparing available stock
      return b.quantity - a.quantity;
    }
    // Default or newest
    const aTime = a.createdAt?.seconds || 0;
    const bTime = b.createdAt?.seconds || 0;
    return bTime - aTime;
  });

  return (
    <div className="space-y-8">
      {/* Visual Banners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-y border-gray-100 bg-white px-8 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3 text-sm text-gray-600 px-4 py-2">
          <Award className="text-green-600 shrink-0" size={18} />
          <div>
            <p className="font-bold">100% Organic Verified</p>
            <p className="text-[10px] text-gray-400">Strictly chemical-free inputs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 px-4 py-2">
          <Truck className="text-green-600 shrink-0" size={18} />
          <div>
            <p className="font-bold">Free Local Delivery</p>
            <p className="text-[10px] text-gray-400">On all orders above ₹500</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 px-4 py-2">
          <ShieldCheck className="text-green-600 shrink-0" size={18} />
          <div>
            <p className="font-bold">Direct From Farmers</p>
            <p className="text-[10px] text-gray-400">Support local urban growers</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-600 px-4 py-2">
          <Sparkles className="text-green-600 shrink-0" size={18} />
          <div>
            <p className="font-bold">AI Recommended Setup</p>
            <p className="text-[10px] text-gray-400">Filter tags matched to terrace plan</p>
          </div>
        </div>
      </div>

      {/* Main double column storefront layout */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar Filters */}
        <ProductFilter 
          uniqueLocations={uniqueLocations} 
          onFilterChange={setFilters} 
        />

        {/* Product Catalog Grid list */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-400 font-semibold px-1">
            <span>Showing {filteredProducts.length} active listings</span>
            {filters.category !== "All" && (
              <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-100">
                {filters.category} {filters.subcategory !== "All" && `> ${filters.subcategory}`}
              </span>
            )}
          </div>

          {loadingProducts ? (
            <div className="text-center py-20 text-gray-500 font-semibold gap-2 flex justify-center items-center">
              <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading products...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 text-gray-400 space-y-2">
              <ShoppingBag size={48} className="mx-auto text-gray-300 opacity-60" />
              <p className="font-bold text-lg text-gray-650">No products match your criteria</p>
              <p className="text-sm max-w-md mx-auto">
                Try resetting filters, searching for alternative items, or checking back later.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onViewDetails={setSelectedProduct}
                  onViewSeller={setSelectedSellerId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onViewSeller={setSelectedSellerId}
        />
      )}

      {/* Seller Profile Modal */}
      {selectedSellerId && (
        <SellerProfileModal
          sellerId={selectedSellerId}
          onClose={() => setSelectedSellerId(null)}
          onAddToCart={addToCart}
          onViewProductDetails={setSelectedProduct}
        />
      )}
    </div>
  );
}
