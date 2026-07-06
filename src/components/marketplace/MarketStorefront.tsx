import React, { useState, useEffect } from "react";
import { Product } from "@/types/marketplace";
import { useMarketplace } from "./MarketplaceContext";
import ProductCard from "./ProductCard";
import ProductFilter, { FilterValues } from "./ProductFilter";
import ProductDetail from "./ProductDetail";
import SellerProfileModal from "./SellerProfileModal";
import { useLanguage } from "@/components/common/LanguageContext";
import { Sparkles, Award, Truck, ShieldCheck, ShoppingBag } from "lucide-react";
import { RecommendationEngineService } from "@/services/recommendationEngineService";
import { auth } from "@/lib/firebase";

export default function MarketStorefront() {
  const { t } = useLanguage();
  const { products, loadingProducts, addToCart } = useMarketplace();

  // Active product details or seller profile modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Recommendations State
  const [personalizationContext, setPersonalizationContext] = useState<any>(null);
  const [recommendationsMap, setRecommendationsMap] = useState<Record<string, any>>({});
  const [activeRecommendationTab, setActiveRecommendationTab] = useState<string>("all");
  const [activeSmartFilter, setActiveSmartFilter] = useState<string>("all");

  useEffect(() => {
    const loadPersonalization = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const context = await RecommendationEngineService.loadPersonalizationContext(user.uid);
        setPersonalizationContext(context);

        // Score all products immediately
        const scores: Record<string, any> = {};
        products.forEach((prod) => {
          if (prod.id) {
            scores[prod.id] = RecommendationEngineService.calculateSuitabilityScore(prod, context);
          }
        });
        setRecommendationsMap(scores);

        // Store standard recommendation list to history on load
        if (products.length > 0) {
          const listToSave = products
            .filter((p) => p.id && scores[p.id])
            .map((p) => ({ productId: p.id!, score: scores[p.id!].score }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
          
          await RecommendationEngineService.saveRecommendationHistory(
            user.uid,
            "Personalized Feed",
            listToSave,
            "general"
          );
        }
      } catch (err) {
        console.error("Error generating personalized recommendations:", err);
      }
    };

    if (products.length > 0) {
      loadPersonalization();
    }
  }, [products]);

  const getProductsForTab = (tab: string) => {
    let list = [...products];

    if (tab === "recommended") {
      list.sort((a, b) => {
        const scoreA = recommendationsMap[a.id!]?.score || 0;
        const scoreB = recommendationsMap[b.id!]?.score || 0;
        return scoreB - scoreA;
      });
    } else if (tab === "weather") {
      list = list.filter((p) => {
        const hasWeatherExplanation = recommendationsMap[p.id!]?.explanations.some((e: string) =>
          e.toLowerCase().includes("weather") || e.toLowerCase().includes("rain") || e.toLowerCase().includes("sunny")
        );
        return hasWeatherExplanation || p.category === "Watering & Irrigation";
      });
      list.sort((a, b) => {
        const scoreA = recommendationsMap[a.id!]?.score || 0;
        const scoreB = recommendationsMap[b.id!]?.score || 0;
        return scoreB - scoreA;
      });
    } else if (tab === "terrace") {
      list = list.filter((p) => p.category === "Terrace Setup" || p.category === "Hydroponics");
      list.sort((a, b) => {
        const scoreA = recommendationsMap[a.id!]?.score || 0;
        const scoreB = recommendationsMap[b.id!]?.score || 0;
        return scoreB - scoreA;
      });
    } else if (tab === "crop") {
      list = list.filter((p) => p.category === "Organic Farming Inputs" || p.category === "Seeds & Plants");
      list.sort((a, b) => {
        const scoreA = recommendationsMap[a.id!]?.score || 0;
        const scoreB = recommendationsMap[b.id!]?.score || 0;
        return scoreB - scoreA;
      });
    } else if (tab === "trending") {
      list.sort((a, b) => b.quantity - a.quantity);
    } else if (tab === "newly_added") {
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
    }

    return list;
  };

  const handleTabChange = async (tab: string) => {
    setActiveRecommendationTab(tab);
    setActiveSmartFilter("all");

    const user = auth.currentUser;
    if (!user || !personalizationContext || products.length === 0) return;

    try {
      let refId = "general";
      let typeLabel = "Personalized Feed";

      if (tab === "crop" && personalizationContext.cropAnalyses.length > 0) {
        refId = personalizationContext.cropAnalyses[0].id || "crop";
        typeLabel = "Based on Crop Analysis";
      } else if (tab === "terrace" && personalizationContext.terraceAnalyses.length > 0) {
        refId = personalizationContext.terraceAnalyses[0].id || "terrace";
        typeLabel = "Based on Your Terrace";
      } else if (tab === "weather") {
        refId = "weather";
        typeLabel = "Weather Based";
      } else if (tab === "trending") {
        typeLabel = "Trending Products";
      } else if (tab === "newly_added") {
        typeLabel = "Newly Added";
      }

      const tabProducts = getProductsForTab(tab);
      const listToSave = tabProducts
        .filter((p) => p.id && recommendationsMap[p.id])
        .map((p) => ({ productId: p.id!, score: recommendationsMap[p.id!].score }))
        .slice(0, 10);

      await RecommendationEngineService.saveRecommendationHistory(
        user.uid,
        typeLabel,
        listToSave,
        refId
      );
    } catch (err) {
      console.error("Failed to save recommendation history:", err);
    }
  };

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

  // 1. Get base list for active recommendation tab
  let baseProducts = getProductsForTab(activeRecommendationTab);

  // 2. Apply active smart filter if any AI tab is active
  if (activeRecommendationTab !== "all" && activeSmartFilter !== "all") {
    if (activeSmartFilter === "organic") {
      baseProducts = baseProducts.filter((p) => p.organicCertified);
    } else if (activeSmartFilter === "budget") {
      baseProducts = baseProducts.filter((p) => p.price <= 500);
    } else if (activeSmartFilter === "hydro") {
      baseProducts = baseProducts.filter((p) => p.category === "Hydroponics" || p.productName.toLowerCase().includes("hydroponic"));
    } else if (activeSmartFilter === "soil") {
      baseProducts = baseProducts.filter((p) => p.category === "Terrace Setup" || p.category === "Organic Farming Inputs");
    } else if (activeSmartFilter === "indoor") {
      baseProducts = baseProducts.filter((p) => p.productName.toLowerCase().includes("indoor") || p.subcategory.toLowerCase().includes("indoor") || (p.category === "Seeds & Plants" && p.subcategory === "Indoor Plants"));
    } else if (activeSmartFilter === "outdoor") {
      baseProducts = baseProducts.filter((p) => p.productName.toLowerCase().includes("outdoor") || p.subcategory.toLowerCase().includes("outdoor") || (p.category === "Seeds & Plants" && p.subcategory === "Outdoor Plants") || p.category === "Terrace Setup");
    } else if (activeSmartFilter === "beginner") {
      baseProducts = baseProducts.filter((p) => p.description.toLowerCase().includes("easy") || p.description.toLowerCase().includes("beginner") || p.description.toLowerCase().includes("starter") || p.price < 500);
    } else if (activeSmartFilter === "advanced") {
      baseProducts = baseProducts.filter((p) => p.description.toLowerCase().includes("advanced") || p.description.toLowerCase().includes("professional") || p.category === "Hydroponics");
    }
  }

  // Apply filters client-side
  let filteredProducts = baseProducts.filter((product) => {
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
    // If an AI tab is active and user didn't request explicit price sorting, rank by suitability score
    if (
      (activeRecommendationTab === "recommended" ||
        activeRecommendationTab === "weather" ||
        activeRecommendationTab === "terrace" ||
        activeRecommendationTab === "crop") &&
      filters.sortBy !== "price_asc" &&
      filters.sortBy !== "price_desc"
    ) {
      const scoreA = recommendationsMap[a.id!]?.score || 0;
      const scoreB = recommendationsMap[b.id!]?.score || 0;
      return scoreB - scoreA;
    }

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

      {/* AI Recommendations Hub */}
      <div className="space-y-4 bg-green-50/10 p-6 rounded-3xl border border-green-100">
        <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
          ✨ AI Recommendations Hub
        </h3>
        
        {/* Recommendation Tabs */}
        <div className="flex flex-wrap gap-2.5">
          {[
            { id: "all", label: "All Products" },
            { id: "recommended", label: "🌟 Recommended For You" },
            { id: "weather", label: "🌤 Weather Based" },
            { id: "terrace", label: "🌱 Based on Your Terrace" },
            { id: "crop", label: "🌿 Based on Crop Analysis" },
            { id: "trending", label: "🔥 Trending Products" },
            { id: "newly_added", label: "🆕 Newly Added" }
          ].map((tabChip) => (
            <button
              key={tabChip.id}
              onClick={() => handleTabChange(tabChip.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition select-none cursor-pointer ${
                activeRecommendationTab === tabChip.id
                  ? "bg-green-700 text-white animate-pulse"
                  : "bg-white border border-gray-150 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tabChip.label}
            </button>
          ))}
        </div>

        {/* Secondary Smart Filters */}
        {activeRecommendationTab !== "all" && (
          <div className="pt-3 border-t border-green-100 flex flex-wrap items-center gap-2">
            <span className="text-gray-400 text-xs font-semibold mr-1">Smart Filters:</span>
            {[
              { id: "all", label: "All Matches" },
              { id: "organic", label: "🌿 Organic Only" },
              { id: "budget", label: "💰 Budget Friendly" },
              { id: "hydro", label: "💧 Hydroponics" },
              { id: "soil", label: "🌱 Soil Farming" },
              { id: "indoor", label: "🏠 Indoor" },
              { id: "outdoor", label: "🌳 Outdoor" },
              { id: "beginner", label: "🟢 Beginner Friendly" },
              { id: "advanced", label: "🔴 Advanced" }
            ].map((sf) => (
              <button
                key={sf.id}
                onClick={() => setActiveSmartFilter(sf.id)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold transition select-none cursor-pointer ${
                  activeSmartFilter === sf.id
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-55"
                }`}
              >
                {sf.label}
              </button>
            ))}
          </div>
        )}
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
                  recommendation={recommendationsMap[product.id!]}
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
