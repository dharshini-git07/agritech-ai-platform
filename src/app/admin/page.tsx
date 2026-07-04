"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { 
  getAllSellers, 
  approveSellerProfile, 
  getProducts, 
  approveProduct, 
  deleteProduct 
} from "@/services/marketplaceService";
import { SellerProfile, Product } from "@/types/marketplace";
import { useLanguage, Language } from "@/components/common/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Package, 
  Tags, 
  Check, 
  X, 
  LogOut, 
  Store, 
  ShieldAlert, 
  MapPin, 
  Phone,
  Trash
} from "lucide-react";

type AdminTab = "sellers" | "products" | "categories";

export default function AdminPortal() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  // Admin Data State
  const [activeTab, setActiveTab] = useState<AdminTab>("sellers");
  const [sellers, setSellers] = useState<{ uid: string; name: string; email: string; sellerProfile: SellerProfile }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Verify if role is admin
            if (data.role !== "admin") {
              alert("Unauthorized! Admin access only.");
              await signOut(auth);
              router.push("/login");
              return;
            }

            setProfile({
              name: data.name || "Administrator",
              email: data.email || user.email || "",
            });
            
            // Load admin data
            await loadAdminData();
          } else {
            alert("Unauthorized!");
            await signOut(auth);
            router.push("/login");
          }
        } catch (err) {
          console.error("Failed to load admin profile:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [router, activeTab]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      if (activeTab === "sellers") {
        const list = await getAllSellers();
        setSellers(list);
      } else if (activeTab === "products") {
        const list = await getProducts(); // Loads all products sorted by newest first
        setProducts(list);
      }
    } catch (err) {
      console.error("Failed to load admin panel data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSellerApproval = async (uid: string, status: "approved" | "rejected") => {
    try {
      await approveSellerProfile(uid, status);
      alert(`Seller profile verification status set to ${status}.`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to update seller profile: " + err.message);
    }
  };

  const handleProductApproval = async (productId: string, status: "approved" | "rejected") => {
    try {
      await approveProduct(productId, status);
      alert(`Product approval status set to ${status}.`);
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to update product approval: " + err.message);
    }
  };

  const handleProductDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      await deleteProduct(productId);
      alert("Product listing deleted successfully.");
      await loadAdminData();
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* Admin Header Bar */}
        <header className="flex justify-between items-center bg-white border-b border-gray-100 px-8 py-4 relative z-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-50 text-red-700 rounded-xl">
              <ShieldAlert size={20} />
            </span>
            <h1 className="text-xl font-bold text-gray-800">AgriTech AI — Admin Panel</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Nav button to customer catalog */}
            <button
              onClick={() => router.push("/customer")}
              className="hidden md:flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3.5 py-2 rounded-xl transition font-bold cursor-pointer"
            >
              Browse Shop Catalog
            </button>

            {profile && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-2xl transition focus:outline-none select-none text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold text-lg border border-red-200">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">
                      {profile.name}
                    </p>
                    <p className="text-xs text-red-500 font-bold tracking-wider">
                      Administrator
                    </p>
                  </div>
                </button>

                {isOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-gray-100 py-3 text-sm text-gray-700 animate-in fade-in-50 slide-in-from-top-3 duration-200">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-800 text-base">
                        {profile.name}
                      </p>
                      <p className="text-xs text-red-500 font-bold tracking-wider">
                        Administrator
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {profile.email}
                      </p>
                    </div>

                    <div className="px-5 py-3 border-b border-gray-100">
                      <label className="text-xs text-gray-400 font-semibold block mb-1">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 text-xs text-gray-700 focus:outline-none cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="ta">தமிழ்</option>
                        <option value="hi">हिन्दी</option>
                      </select>
                    </div>

                    <div className="py-2 px-3">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-2xl flex items-center gap-3 transition font-semibold cursor-pointer"
                      >
                        <LogOut size={18} />
                        <span>{t("logout")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Admin Navigation Tabs */}
        <div className="bg-white border-b border-gray-100 px-8 py-1 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab("sellers")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "sellers"
                ? "border-red-650 text-red-650"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Users size={16} />
            <span>Sellers Approval ({sellers.filter(s => s.sellerProfile.verificationStatus === "pending").length} pending)</span>
          </button>
          
          <button
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "products"
                ? "border-red-650 text-red-650"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Package size={16} />
            <span>Products Review ({products.filter(p => p.approvalStatus === "pending").length} pending)</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "categories"
                ? "border-red-650 text-red-650"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Tags size={16} />
            <span>Manage Categories</span>
          </button>
        </div>

        {/* Tab Panel contents */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="flex justify-center items-center h-[50vh] text-gray-500 font-semibold gap-2">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Loading admin panel details...</span>
            </div>
          ) : (
            <div>
              {/* Tab 1: Sellers Approval Panel */}
              {activeTab === "sellers" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Sellers Registration Management</h2>
                  {sellers.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-400">
                      No sellers found in the platform.
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {sellers.map((seller) => (
                        <div
                          key={seller.uid}
                          className="bg-white rounded-3xl border border-gray-150 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Store className="text-green-700 shrink-0" size={20} />
                                <h3 className="font-bold text-gray-850 text-base">
                                  {seller.sellerProfile.businessName}
                                </h3>
                              </div>
                              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                                seller.sellerProfile.verificationStatus === "approved"
                                  ? "bg-green-55 border-green-200 text-green-800"
                                  : seller.sellerProfile.verificationStatus === "rejected"
                                  ? "bg-red-50 border-red-200 text-red-800"
                                  : "bg-amber-50 border-amber-200 text-amber-800"
                              }`}>
                                {seller.sellerProfile.verificationStatus}
                              </span>
                            </div>

                            <p className="text-xs text-gray-400 font-medium capitalize">
                              Type: {seller.sellerProfile.sellerType} | Farmer: {seller.name}
                            </p>

                            <p className="text-sm text-gray-600 line-clamp-3 italic">
                              "{seller.sellerProfile.description}"
                            </p>

                            <div className="flex flex-col gap-1 pt-2 text-xs text-gray-500 border-t border-gray-50">
                              <span className="flex items-center gap-1">
                                <MapPin size={12} /> {seller.sellerProfile.address}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {seller.sellerProfile.contactNumber}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-4 mt-4 border-t border-gray-50 justify-end">
                            {seller.sellerProfile.verificationStatus !== "approved" && (
                              <Button
                                onClick={() => handleSellerApproval(seller.uid, "approved")}
                                className="bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-1.5 px-4 rounded-xl flex items-center gap-1"
                              >
                                <Check size={14} /> Approve
                              </Button>
                            )}
                            {seller.sellerProfile.verificationStatus !== "rejected" && (
                              <Button
                                onClick={() => handleSellerApproval(seller.uid, "rejected")}
                                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-650 font-bold text-xs py-1.5 px-4 rounded-xl flex items-center gap-1"
                              >
                                <X size={14} /> Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Products Review Panel */}
              {activeTab === "products" && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800">Products Listing Approvals</h2>
                  {products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-400">
                      No products registered.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="bg-white rounded-3xl border border-gray-150 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="relative aspect-[4/3] bg-gray-50">
                              <img
                                src={product.images?.[0]}
                                alt={product.productName}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute top-3 left-3 bg-white/95 text-green-850 text-xs font-bold px-2 py-0.5 rounded-full border shadow-xs">
                                {product.category}
                              </span>
                              <span className={`absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shadow-md ${
                                product.approvalStatus === "approved"
                                  ? "bg-green-700 text-white"
                                  : product.approvalStatus === "rejected"
                                  ? "bg-red-600 text-white"
                                  : "bg-amber-500 text-white"
                              }`}>
                                {product.approvalStatus}
                              </span>
                            </div>

                            <div className="p-5 space-y-2">
                              <div className="flex justify-between items-center gap-2">
                                <h3 className="font-bold text-gray-850 text-base truncate">{product.productName}</h3>
                                <span className="font-extrabold text-green-750">₹{product.price.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-gray-400 font-medium capitalize">
                                Seller: {product.businessName} ({product.sellerType})
                              </p>
                              <p className="text-xs text-gray-500 line-clamp-2 italic">
                                "{product.description}"
                              </p>
                            </div>
                          </div>

                          <div className="p-5 pt-0">
                            <div className="flex gap-2 border-t pt-4">
                              {product.approvalStatus === "pending" && (
                                <>
                                  <Button
                                    onClick={() => handleProductApproval(product.id!, "approved")}
                                    className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                                  >
                                    <Check size={14} /> Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleProductApproval(product.id!, "rejected")}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1"
                                  >
                                    <X size={14} /> Reject
                                  </Button>
                                </>
                              )}
                              <Button
                                variant="destructive"
                                onClick={() => handleProductDelete(product.id!)}
                                className="p-2 text-red-650 hover:bg-red-50 rounded-xl border border-red-200 shrink-0"
                              >
                                <Trash size={16} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Categories Panel Placeholder */}
              {activeTab === "categories" && (
                <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-150 p-12 text-center text-gray-400 space-y-4">
                  <Tags size={48} className="mx-auto text-gray-300 opacity-80" />
                  <h3 className="font-bold text-lg text-gray-700">Category Configurator</h3>
                  <p className="text-sm">
                    Preloaded Categories: Fresh Produce, Seeds & Plants, Organic inputs, Terrace Setup, Hydroponics, watering, Garden Tools.
                  </p>
                  <p className="text-xs text-gray-400">
                    Category management is active in marketplace constants. Custom admin interface modifications can be expanded here in future iterations.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}