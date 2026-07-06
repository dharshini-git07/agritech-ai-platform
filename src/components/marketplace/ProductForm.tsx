import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addProduct, updateProduct } from "@/services/marketplaceService";
import { useLanguage } from "@/components/common/LanguageContext";
import { MARKETPLACE_CATEGORIES, CategoryName } from "@/lib/marketplaceConstants";
import { Product } from "@/types/marketplace";
import { X } from "lucide-react";

interface ProductFormProps {
  product?: Product; // If provided, we are in Edit Mode
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);

  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState<CategoryName>("Fresh Produce");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [organicCertified, setOrganicCertified] = useState(false);
  const [location, setLocation] = useState("");
  const [availability, setAvailability] = useState<"in_stock" | "out_of_stock">("in_stock");
  const [imageUrl, setImageUrl] = useState("");

  const categories = Object.keys(MARKETPLACE_CATEGORIES) as CategoryName[];
  const subcategories = MARKETPLACE_CATEGORIES[category] || [];

  useEffect(() => {
    if (product) {
      setProductName(product.productName);
      setCategory(product.category as CategoryName);
      setSubcategory(product.subcategory);
      setDescription(product.description);
      setPrice(String(product.price));
      setQuantity(String(product.quantity));
      setOrganicCertified(product.organicCertified);
      setLocation(product.location);
      setAvailability(product.availability);
      setImageUrl(product.images?.[0] || "");
    } else {
      // Default subcategory
      setSubcategory(MARKETPLACE_CATEGORIES["Fresh Produce"][0]);
    }
  }, [product]);

  // Update subcategory default when category changes
  const handleCategoryChange = (cat: CategoryName) => {
    setCategory(cat);
    const subs = MARKETPLACE_CATEGORIES[cat];
    if (subs && subs.length > 0) {
      setSubcategory(subs[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert("Image file is too large! Please choose an image smaller than 800 KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !description || !price || !quantity || !location) {
      alert("Please fill in all required fields.");
      return;
    }

    const priceNum = parseFloat(price);
    const quantityNum = parseInt(quantity);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid price greater than 0.");
      return;
    }
    if (isNaN(quantityNum) || quantityNum < 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    // Default beautiful visual fallbacks based on category/subcategory if image is not provided
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl) {
      if (category === "Fresh Produce") {
        finalImageUrl = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80";
      } else if (category === "Seeds & Plants") {
        finalImageUrl = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80";
      } else if (category === "Organic Farming Inputs") {
        finalImageUrl = "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80";
      } else if (category === "Hydroponics") {
        finalImageUrl = "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80";
      } else {
        finalImageUrl = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80";
      }
    }

    setLoading(true);
    try {
      const data = {
        productName,
        category,
        subcategory,
        description,
        price: priceNum,
        quantity: quantityNum,
        images: [finalImageUrl],
        organicCertified,
        location,
        availability: quantityNum > 0 ? availability : "out_of_stock",
      };

      if (product?.id) {
        await updateProduct(product.id, data);
        alert("Product updated successfully! Pending admin approval.");
      } else {
        await addProduct(data);
        alert("Product added successfully! Pending admin approval.");
      }
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 w-full max-w-xl mx-auto border border-gray-150 max-h-[90vh] overflow-y-auto shadow-2xl relative">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">
          {product ? t("editProduct") : t("addProduct")}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {product 
            ? "Modify your listing details. Note: Updates require administrative re-approval." 
            : "Describe your fresh produce, tool, or garden input to list in Namma Kadai."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Product Name *
          </label>
          <Input
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g. Organic Ooty Carrots"
            required
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as CategoryName)}
              className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              Subcategory *
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              {subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t("price")} (₹) *
            </label>
            <Input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 80.00"
              required
              className="rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t("quantity")} (Stock) *
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 25"
              required
              className="rounded-xl"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={organicCertified}
              onChange={(e) => setOrganicCertified(e.target.checked)}
              className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
            />
            <span className="text-sm font-semibold text-gray-700">{t("organicCertified")}</span>
          </label>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {t("availability")}
            </label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as any)}
              className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
            >
              <option value="in_stock">{t("inStock")}</option>
              <option value="out_of_stock">{t("outOfStock")}</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            {t("location")} (City/Town) *
          </label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Coimbatore, Tamil Nadu"
            required
            className="rounded-xl"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            Product Photo
          </label>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-dashed border-gray-200">
            {imageUrl ? (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border shrink-0 bg-white shadow-xs">
                <img
                  src={imageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full text-xs hover:bg-red-700 transition"
                  title="Remove image"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-xl border bg-white flex items-center justify-center text-gray-300 shrink-0 shadow-xs">
                <span className="text-2xl">📸</span>
              </div>
            )}
            
            <div className="flex-1 w-full space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="product-photo-upload"
              />
              <label
                htmlFor="product-photo-upload"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-250 bg-white hover:bg-gray-50 text-gray-705 font-bold text-xs rounded-xl shadow-sm cursor-pointer select-none transition"
              >
                Choose Image File...
              </label>
              
              <div className="text-[10px] text-gray-400 font-medium">
                <p>Upload a photo of your fresh terrace harvest. Limit size to 800 KB.</p>
                <p className="mt-0.5">Or paste a web link below:</p>
              </div>
              
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste direct image web URL here"
                className="rounded-xl h-8 text-xs"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
            {t("description")} *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nutritional value, growth method, usage guidelines..."
            required
            rows={3}
            className="w-full bg-white border border-gray-250 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-5 py-2 rounded-xl"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="px-6 py-2 rounded-xl bg-green-700 hover:bg-green-800 text-white font-bold"
            disabled={loading}
          >
            {loading ? "Saving..." : product ? "Update Product" : "Publish Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}
