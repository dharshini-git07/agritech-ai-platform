"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { SellerProfile, Product } from "@/types/marketplace";
import { getProducts, deleteProduct } from "@/services/marketplaceService";
import SellerForm from "@/components/marketplace/SellerForm";
import ProductForm from "@/components/marketplace/ProductForm";
import ProductCard from "@/components/marketplace/ProductCard";
import { useLanguage } from "@/components/common/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  Store, 
  PackagePlus, 
  ShoppingBag, 
  Layers, 
  Settings2,
  Phone,
  MapPin,
  Star,
  Plus
} from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { getSellerOrders, updateOrderStatus, cancelOrder } from "@/services/orderService";
import OrderCard from "@/components/marketplace/OrderCard";

type SubView = "products" | "profile" | "orders";

export default function SellerDashboard() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  
  // Products Management
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Orders Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // View controllers
  const [activeTab, setActiveTab] = useState<SubView>("products");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkSellerStatus(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkSellerStatus = async (uid: string) => {
    setLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "users", uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isSeller && data.sellerProfile) {
          setIsSeller(true);
          setSellerProfile(data.sellerProfile as SellerProfile);
          await loadSellerProducts(uid);
          await loadSellerOrdersData(uid);
        } else {
          setIsSeller(false);
          setSellerProfile(null);
        }
      }
    } catch (err) {
      console.error("Error checking seller status:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerProducts = async (uid: string) => {
    setLoadingProducts(true);
    try {
      const list = await getProducts({ sellerId: uid });
      setProducts(list);
    } catch (err) {
      console.error("Error loading seller products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadSellerOrdersData = async (uid: string) => {
    setLoadingOrders(true);
    try {
      const list = await getSellerOrders(uid);
      setOrders(list);
    } catch (err) {
      console.error("Error loading seller orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      alert(`Order status updated to: ${status}`);
      const user = auth.currentUser;
      if (user) {
        await loadSellerOrdersData(user.uid);
        await loadSellerProducts(user.uid); // Refresh stock display if quantity changes
      }
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleOrderCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      alert("Order cancelled successfully.");
      const user = auth.currentUser;
      if (user) {
        await loadSellerOrdersData(user.uid);
        await loadSellerProducts(user.uid); // Refresh product stocks
      }
    } catch (err: any) {
      alert("Failed to cancel order: " + err.message);
    }
  };

  const handleProductDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product listing?")) return;
    try {
      await deleteProduct(productId);
      alert("Product listing deleted successfully.");
      const user = auth.currentUser;
      if (user) await loadSellerProducts(user.uid);
    } catch (err: any) {
      alert("Failed to delete product: " + err.message);
    }
  };

  const handleProductFormSuccess = async () => {
    setShowProductForm(false);
    setEditingProduct(undefined);
    const user = auth.currentUser;
    if (user) {
      await checkSellerStatus(user.uid);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-500 font-semibold gap-2">
        <div className="w-8 h-8 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
        <span>Checking profile details...</span>
      </div>
    );
  }

  // Not a seller yet: render the registration page
  if (!isSeller) {
    return (
      <div className="p-8">
        <SellerForm onSuccess={() => auth.currentUser && checkSellerStatus(auth.currentUser.uid)} />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      {/* Seller Header Summary */}
      {sellerProfile && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3.5 bg-green-50 rounded-2xl text-green-700 border border-green-100">
                <Store size={26} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{sellerProfile.businessName}</h2>
                <p className="text-xs text-gray-400 capitalize font-medium">{t(sellerProfile.sellerType as any || "dashboard")} Store</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-xs text-gray-500 font-medium pt-1.5">
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-green-600" /> {sellerProfile.address}
              </span>
              <span className="flex items-center gap-1">
                <Phone size={14} className="text-green-600" /> {sellerProfile.contactNumber}
              </span>
              <span className="flex items-center gap-1">
                <Star size={14} className="text-amber-500 fill-amber-500" /> {sellerProfile.rating.toFixed(1)} Shop Rating
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0 w-full md:w-auto">
            {/* Status indicators */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Status:</span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border capitalize ${
                sellerProfile.verificationStatus === "approved"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : sellerProfile.verificationStatus === "rejected"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                {sellerProfile.verificationStatus === "approved" 
                  ? t("approved") 
                  : sellerProfile.verificationStatus === "rejected" 
                  ? t("rejected") 
                  : t("pendingApproval")}
              </span>
            </div>

            {/* Quick action buttons */}
            {sellerProfile.verificationStatus === "approved" && (
              <Button
                onClick={() => {
                  setEditingProduct(undefined);
                  setShowProductForm(true);
                }}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl flex items-center justify-center gap-2 font-bold py-2"
              >
                <Plus size={16} />
                <span>{t("addProduct")}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Tabs selector */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
            activeTab === "products"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Layers size={16} />
          <span>{t("myProducts")}</span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
            activeTab === "orders"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ShoppingBag size={16} />
          <span>My Orders</span>
          {orders.filter(o => o.orderStatus === "Pending").length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
              {orders.filter(o => o.orderStatus === "Pending").length} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
            activeTab === "profile"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings2 size={16} />
          <span>Manage Store Profile</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === "products" && (
          <div className="space-y-6">
            {loadingProducts ? (
              <div className="text-center py-10 text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400 space-y-4 max-w-2xl mx-auto">
                <Store size={40} className="mx-auto text-gray-300" />
                <h3 className="font-bold text-lg text-gray-700">No products listed</h3>
                <p className="text-sm">
                  {sellerProfile?.verificationStatus === "approved"
                    ? "Start listing your organic inputs, equipment, fresh herbs, or veggies for local shoppers!"
                    : "Your seller profile is pending approval. You can prepare product details now, but they will become visible in the marketplace catalog once verified."}
                </p>
                <Button
                  onClick={() => {
                    setEditingProduct(undefined);
                    setShowProductForm(true);
                  }}
                  className="bg-green-700 text-white rounded-xl font-bold px-6"
                >
                  Create Your First Listing
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isOwner={true}
                    onEdit={(p) => {
                      setEditingProduct(p);
                      setShowProductForm(true);
                    }}
                    onDelete={handleProductDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800">Incoming Customer Orders</h3>
            
            {loadingOrders ? (
              <div className="text-center py-10 text-gray-500">Loading incoming orders...</div>
            ) : orders.length === 0 ? (
              <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-150 p-12 text-center text-gray-400 space-y-4">
                <ShoppingBag size={48} className="mx-auto text-gray-300 opacity-80" />
                <h3 className="font-bold text-lg text-gray-700">No orders received yet</h3>
                <p className="text-sm">
                  As customers purchase your catalog items, their shipments will show up here. You can manage status updates, accept, or cancel orders directly.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {orders.map((ord) => (
                  <OrderCard
                    key={ord.id}
                    order={ord}
                    role="seller"
                    onStatusChange={handleOrderStatusChange}
                    onCancel={handleOrderCancel}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <SellerForm onSuccess={() => auth.currentUser && checkSellerStatus(auth.currentUser.uid)} />
        )}
      </div>

      {/* Product Form Modal overlay */}
      {showProductForm && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <ProductForm
            product={editingProduct}
            onSuccess={handleProductFormSuccess}
            onCancel={() => {
              setShowProductForm(false);
              setEditingProduct(undefined);
            }}
          />
        </div>
      )}
    </div>
  );
}
