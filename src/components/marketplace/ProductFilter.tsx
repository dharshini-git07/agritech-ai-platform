import React, { useState, useEffect } from "react";
import { useLanguage } from "@/components/common/LanguageContext";
import { MARKETPLACE_CATEGORIES, SELLER_TYPES } from "@/lib/marketplaceConstants";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, Star, Award, RotateCcw } from "lucide-react";

export interface FilterValues {
  search: string;
  category: string;
  subcategory: string;
  sellerType: string;
  location: string;
  minPrice: number | null;
  maxPrice: number | null;
  organicOnly: boolean;
  sortBy: "price_asc" | "price_desc" | "newest" | "popular";
}

interface ProductFilterProps {
  uniqueLocations: string[];
  onFilterChange: (filters: FilterValues) => void;
}

export default function ProductFilter({ uniqueLocations, onFilterChange }: ProductFilterProps) {
  const { t } = useLanguage();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [subcategory, setSubcategory] = useState("All");
  const [sellerType, setSellerType] = useState("All");
  const [location, setLocation] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [organicOnly, setOrganicOnly] = useState(false);
  const [sortBy, setSortBy] = useState<FilterValues["sortBy"]>("newest");

  // Trigger onFilterChange whenever any filter state changes
  useEffect(() => {
    onFilterChange({
      search,
      category,
      subcategory,
      sellerType,
      location,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      organicOnly,
      sortBy,
    });
  }, [search, category, subcategory, sellerType, location, minPrice, maxPrice, organicOnly, sortBy]);

  const categories = ["All", ...Object.keys(MARKETPLACE_CATEGORIES)];
  const subcategories = category !== "All" 
    ? ["All", ...(MARKETPLACE_CATEGORIES[category as keyof typeof MARKETPLACE_CATEGORIES] || [])] 
    : ["All"];

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSubcategory("All"); // Reset subcategory when category shifts
  };

  const handleReset = () => {
    setSearch("");
    setCategory("All");
    setSubcategory("All");
    setSellerType("All");
    setLocation("All");
    setMinPrice("");
    setMaxPrice("");
    setOrganicOnly(false);
    setSortBy("newest");
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm space-y-6 shrink-0 w-full md:w-72">
      <div className="flex items-center justify-between border-b pb-4">
        <h3
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="font-bold text-gray-800 text-lg flex items-center gap-2 cursor-pointer md:cursor-default select-none"
        >
          <SlidersHorizontal size={18} className="text-green-700" />
          <span>Filters</span>
          <span className="text-[10px] bg-green-50 text-green-750 px-2 py-0.5 rounded-full font-bold md:hidden">
            {showMobileFilters ? "Tap to Hide" : "Tap to Expand"}
          </span>
        </h3>
        <button
          onClick={handleReset}
          className="text-xs text-gray-400 hover:text-green-700 flex items-center gap-1 font-semibold transition cursor-pointer"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className={`${showMobileFilters ? "block animate-in fade-in duration-200" : "hidden"} md:block space-y-6`}>

      {/* 1. Instant Text Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <Input
            type="text"
            placeholder={t("searchProducts")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 text-sm rounded-xl border-gray-200 focus:border-green-400"
          />
        </div>
      </div>

      {/* 2. Sorting */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as FilterValues["sortBy"])}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
        >
          <option value="newest">Newest Products</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>

      {/* 3. Category Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
        <select
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? t("allCategories") : cat}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Subcategory Filter (Dynamic) */}
      {category !== "All" && (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subcategory</label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
          >
            {subcategories.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 5. Seller Type Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("sellerType")}</label>
        <select
          value={sellerType}
          onChange={(e) => setSellerType(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
        >
          <option value="All">All Seller Types</option>
          {SELLER_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}s
            </option>
          ))}
        </select>
      </div>

      {/* 6. Dynamic Location Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("location")}</label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
        >
          <option value="All">All Locations</option>
          {uniqueLocations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* 7. Price Filter */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("price")} Range (₹)</label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-xl border-gray-200 text-xs px-2.5 py-1 text-center"
          />
          <span className="text-gray-400 text-xs">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-xl border-gray-200 text-xs px-2.5 py-1 text-center"
          />
        </div>
      </div>

      {/* 8. Organic Certified Switch */}
      <div className="pt-2">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={organicOnly}
            onChange={(e) => setOrganicOnly(e.target.checked)}
            className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
          />
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Award size={16} className="text-emerald-600" />
            <span>Organic Certified</span>
          </span>
        </label>
      </div>
      </div>
    </div>
  );
}
