"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MarketStorefront from "@/components/marketplace/MarketStorefront";
import AiShoppingAssistant from "@/components/marketplace/AiShoppingAssistant";
import { useMarketplace } from "@/components/marketplace/MarketplaceContext";
import ProductCard from "@/components/marketplace/ProductCard";
import ProductDetail from "@/components/marketplace/ProductDetail";
import SellerProfileModal from "@/components/marketplace/SellerProfileModal";
import { useLanguage, Language } from "@/components/common/LanguageContext";
import SellerForm from "@/components/marketplace/SellerForm";
import ProductForm from "@/components/marketplace/ProductForm";
import { SellerProfile, Product as SellerProduct } from "@/types/marketplace";
import { getProducts, deleteProduct } from "@/services/marketplaceService";
import { getSellerOrders, updateOrderStatus } from "@/services/orderService";
import { Layers, Settings2 } from "lucide-react";
import { 
  User, 
  LogOut, 
  ShieldAlert, 
  ShoppingBag, 
  Heart, 
  Eye, 
  Store, 
  Trash, 
  Minus, 
  Plus, 
  CreditCard,
  CheckCircle2,
  Bookmark,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CheckoutModal from "@/components/marketplace/CheckoutModal";
import { Order, OrderStatus } from "@/types/order";
import { getCustomerOrders, cancelOrder } from "@/services/orderService";
import OrderCard from "@/components/marketplace/OrderCard";

type CustomerTab = "browse" | "cart" | "wishlist" | "recent" | "orders" | "seller_center";

export default function CustomerPortal() {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();
  const { 
    cartItems, 
    wishlistIds, 
    products, 
    updateCartQuantity, 
    removeCartItem, 
    clearCart, 
    addToCart,
    toggleWishlist
  } = useMarketplace();

  const [activeTab, setActiveTab] = useState<CustomerTab>("browse");
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    role: string;
    email: string;
  } | null>(null);

  // Checkout & Orders States
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // Seller Center States
  const [isSeller, setIsSeller] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [loadingSellerProducts, setLoadingSellerProducts] = useState(false);
  const [incomingOrders, setIncomingOrders] = useState<Order[]>([]);
  const [loadingIncomingOrders, setLoadingIncomingOrders] = useState(false);
  const [sellerActiveTab, setSellerActiveTab] = useState<"products" | "orders" | "profile">("products");
  const [showSellerProductForm, setShowSellerProductForm] = useState(false);
  const [editingSellerProduct, setEditingSellerProduct] = useState<SellerProduct | undefined>(undefined);

  // Modal controls
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.role !== "customer" && data.role !== "farmer" && data.role !== "admin") {
              alert("Unauthorized access!");
              await signOut(auth);
              router.push("/login");
              return;
            }

            setProfile({
              name: data.name || "Customer",
              role: data.role || "customer",
              email: data.email || user.email || "",
            });
            
            const isSel = !!data.isSeller;
            setIsSeller(isSel);
            setSellerProfile(data.sellerProfile || null);
            if (isSel) {
              await loadSellerProducts(user.uid);
              await loadIncomingOrders(user.uid);
            }
            await loadCustomerOrdersData(user.uid);
          } else {
            setProfile({
              name: user.displayName || "Customer",
              role: "customer",
              email: user.email || "",
            });
            await loadCustomerOrdersData(user.uid);
          }
        } catch (err) {
          console.error("Failed to load user profile in customer portal:", err);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  const loadSellerProducts = async (uid: string) => {
    setLoadingSellerProducts(true);
    try {
      const list = await getProducts({ sellerId: uid });
      setSellerProducts(list);
    } catch (err) {
      console.error("Error loading customer-seller products:", err);
    } finally {
      setLoadingSellerProducts(false);
    }
  };

  const loadIncomingOrders = async (uid: string) => {
    setLoadingIncomingOrders(true);
    try {
      const list = await getSellerOrders(uid);
      setIncomingOrders(list);
    } catch (err) {
      console.error("Error loading customer-seller incoming orders:", err);
    } finally {
      setLoadingIncomingOrders(false);
    }
  };

  const handleIncomingOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status);
      alert(`Order status updated to: ${status}`);
      const user = auth.currentUser;
      if (user) {
        await loadIncomingOrders(user.uid);
        await loadSellerProducts(user.uid);
      }
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleIncomingOrderCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      alert("Order cancelled successfully.");
      const user = auth.currentUser;
      if (user) {
        await loadIncomingOrders(user.uid);
        await loadSellerProducts(user.uid);
      }
    } catch (err: any) {
      alert("Failed to cancel order: " + err.message);
    }
  };

  const handleSellerProductDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;
    try {
      await deleteProduct(productId);
      alert("Listing deleted successfully.");
      const user = auth.currentUser;
      if (user) await loadSellerProducts(user.uid);
    } catch (err: any) {
      alert("Failed to delete listing: " + err.message);
    }
  };

  const handleSellerProductFormSuccess = async () => {
    setShowSellerProductForm(false);
    setEditingSellerProduct(undefined);
    const user = auth.currentUser;
    if (user) {
      await loadSellerProducts(user.uid);
    }
  };

  const handleBecomeSellerSuccess = async () => {
    const user = auth.currentUser;
    if (user) {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsSeller(true);
        setSellerProfile(data.sellerProfile || null);
        await loadSellerProducts(user.uid);
        await loadIncomingOrders(user.uid);
      }
    }
  };

  const loadCustomerOrdersData = async (uid: string) => {
    setLoadingOrders(true);
    try {
      const list = await getCustomerOrders(uid);
      setOrders(list);
    } catch (e) {
      console.error("Error loading customer orders:", e);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOrderCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      alert("Order cancelled successfully.");
      const user = auth.currentUser;
      if (user) await loadCustomerOrdersData(user.uid);
    } catch (err: any) {
      alert("Failed to cancel order: " + err.message);
    }
  };

  const handleCheckoutSuccess = async () => {
    setShowCheckoutModal(false);
    const user = auth.currentUser;
    if (user) {
      await loadCustomerOrdersData(user.uid);
    }
    setActiveTab("orders"); // Navigate to My Orders on placement success
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

  // Joined wishlisted products
  const wishlistedProducts = products.filter((p) => wishlistIds.includes(p.id!));

  // Cart summary calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const gst = subtotal * 0.05; // 5% GST
  const delivery = subtotal > 500 ? 0 : subtotal > 0 ? 50 : 0;
  const total = subtotal + gst + delivery;

  const handleCheckout = () => {
    alert("Buy Now (Placeholder): Your order has been placed! The seller will get in touch with you shortly.");
    clearCart();
  };

  const handleMoveToCart = async (product: any) => {
    await addToCart(product);
    await toggleWishlist(product.id!); // Remove from wishlist on move to cart
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* Customer Header Bar */}
        <header className="flex justify-between items-center bg-white border-b border-gray-100 px-8 py-4 relative z-50 shrink-0 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <h1 className="text-xl font-bold text-green-700">AgriTech AI</h1>
          </div>

          <div className="flex items-center gap-4">
            {profile && profile.role === "farmer" && (
              <button
                onClick={() => router.push("/dashboard")}
                className="hidden md:flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 px-3.5 py-2 rounded-xl transition font-bold cursor-pointer"
              >
                Go to Farming Dashboard
              </button>
            )}
            
            {profile && (
              <div className="relative" ref={dropdownRef}>
                {/* Profile Header Button */}
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-2xl transition focus:outline-none select-none text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-green-150 text-green-850 flex items-center justify-center font-bold text-lg border border-green-200">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block">
                    <p className="font-semibold text-gray-800 text-sm leading-tight">
                      {profile.name}
                    </p>
                    <p className="text-xs text-gray-400 font-medium capitalize">
                      {t(profile.role as any || "customerRoleTitle")}
                    </p>
                  </div>
                </button>

                {/* User Menu Dropdown */}
                {isOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-xl border border-gray-100 py-3 text-sm text-gray-700 animate-in fade-in-50 slide-in-from-top-3 duration-200">
                    <div className="px-5 py-3 border-b border-gray-100">
                      <p className="font-bold text-gray-800 text-base">
                        {profile.name}
                      </p>
                      <p className="text-xs text-gray-400 capitalize font-medium">
                        {t(profile.role as any || "customerRoleTitle")}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {profile.email}
                      </p>
                    </div>

                    {/* Language Selection */}
                    <div className="px-5 py-3 border-b border-gray-100">
                      <label className="text-xs text-gray-400 font-semibold block mb-1">
                        Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-2 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-green-400 cursor-pointer"
                      >
                        <option value="en">English</option>
                        <option value="ta">தமிழ்</option>
                        <option value="hi">हिन्दी</option>
                      </select>
                    </div>

                    <div className="py-2 px-3">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-red-650 hover:bg-red-50 rounded-2xl flex items-center gap-3 transition font-semibold cursor-pointer"
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

        {/* Dynamic customer tabs selector */}
        <div className="bg-white border-b border-gray-100 px-6 md:px-8 py-1 flex gap-2 shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab("browse")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "browse"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-855"
            }`}
          >
            <Store size={16} />
            <span>{t("browseCatalog")}</span>
          </button>
          
          <button
            onClick={() => setActiveTab("cart")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "cart"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-855"
            }`}
          >
            <ShoppingBag size={16} />
            <span>{t("myCart")}</span>
            {cartItems.length > 0 && (
              <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
 
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "wishlist"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-855"
            }`}
          >
            <Heart size={16} />
            <span>{t("myWishlist")}</span>
            {wishlistIds.length > 0 && (
              <span className="bg-red-50 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                {wishlistIds.length}
              </span>
            )}
          </button>
 
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "orders"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-855"
            }`}
          >
            <ClipboardList size={16} />
            <span>{t("myOrders")}</span>
            {orders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                {orders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length} active
              </span>
            )}
          </button>
 
          <button
            onClick={() => setActiveTab("recent")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "recent"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-855"
            }`}
          >
            <Eye size={16} />
            <span>{t("recentlyViewed")}</span>
          </button>
 
          {/* Seller Center Tab */}
          <div className="h-6 w-px bg-gray-200 self-center mx-2 shrink-0" />
          
          <button
            onClick={() => setActiveTab("seller_center")}
            className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition cursor-pointer ${
              activeTab === "seller_center"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-855"
            }`}
          >
            <Store size={16} />
            <span>{t("sellerCenter")}</span>
            {isSeller && incomingOrders.filter(o => o.orderStatus === "Pending").length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                {incomingOrders.filter(o => o.orderStatus === "Pending").length} pending
              </span>
            )}
          </button>
        </div>

        {/* Dashboard Panels */}
        <main className="flex-1 overflow-y-auto p-8 w-full">
          {/* TAB 1: BROWSE CATALOG STOREFRONT */}
          {activeTab === "browse" && <MarketStorefront />}

          {/* TAB 2: MY CART */}
          {activeTab === "cart" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Shopping Cart</h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 text-gray-400 space-y-4 max-w-xl mx-auto">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 opacity-80" />
                  <h3 className="font-bold text-lg text-gray-700">Your cart is empty</h3>
                  <p className="text-sm">
                    Browse the Namma Kadai catalog to discover seeds, organic compost, hydroponics modules, and fresh vegetables listed directly by urban farmers.
                  </p>
                  <Button
                    onClick={() => setActiveTab("browse")}
                    className="bg-green-700 text-white rounded-xl font-bold px-6"
                  >
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Cart items list */}
                  <div className="flex-1 w-full bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center border-b pb-4">
                      <span className="font-bold text-gray-700 text-sm">Cart Items ({cartItems.length})</span>
                      <button
                        onClick={clearCart}
                        className="text-xs text-red-600 hover:text-red-700 font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Trash size={12} /> Clear Cart
                      </button>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {cartItems.map((item) => (
                        <div key={item.product.id} className="py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between w-full">
                          <div className="flex gap-4 items-center w-full min-w-0">
                            <img
                              src={item.product.images?.[0]}
                              alt={item.product.productName}
                              className="w-16 h-16 object-cover rounded-xl border shrink-0"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <h4
                                onClick={() => setSelectedProduct(item.product)}
                                className="font-bold text-gray-800 text-sm hover:text-green-600 cursor-pointer truncate"
                              >
                                {item.product.productName}
                              </h4>
                              <p className="text-xs text-gray-400 font-medium capitalize mt-0.5">
                                Seller: {item.product.businessName} ({item.product.sellerType})
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                Unit Price: ₹{item.product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                              <button
                                onClick={() => updateCartQuantity(item.product.id!, item.quantity - 1)}
                                className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="px-2.5 text-xs font-bold text-gray-700 w-6 text-center select-none">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => {
                                  if (item.quantity < item.product.quantity) {
                                    updateCartQuantity(item.product.id!, item.quantity + 1);
                                  } else {
                                    alert("Cannot exceed available stock limit!");
                                  }
                                }}
                                className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <span className="font-extrabold text-green-750 text-sm w-20 text-right">
                              ₹{(item.product.price * item.quantity).toFixed(2)}
                            </span>

                            <button
                              onClick={() => removeCartItem(item.product.id!)}
                              className="text-gray-400 hover:text-red-500 transition cursor-pointer p-1"
                            >
                              <Trash size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Block */}
                  <div className="w-full lg:w-80 bg-white rounded-3xl border border-gray-150 p-6 space-y-4 shadow-sm shrink-0">
                    <h3 className="font-bold text-gray-800 text-base border-b pb-3">Checkout Details</h3>
                    
                    <div className="space-y-2.5 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Cart Subtotal</span>
                        <span className="font-semibold text-gray-850">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes (5% GST)</span>
                        <span className="font-semibold text-gray-850">₹{gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee</span>
                        <span className="font-semibold text-gray-855">
                          {delivery === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${delivery.toFixed(2)}`}
                        </span>
                      </div>
                      {delivery > 0 && (
                        <p className="text-[10px] text-gray-400 italic text-right">
                          Add ₹{(500 - subtotal).toFixed(2)} more for FREE delivery
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t pt-3 font-extrabold text-gray-800">
                      <span>Total Price</span>
                      <span className="text-xl text-green-800">₹{total.toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={() => setShowCheckoutModal(true)}
                      className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                    >
                      <CreditCard size={18} />
                      <span>Proceed to Checkout</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MY WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Wishlist</h2>

              {wishlistedProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 text-gray-400 space-y-4 max-w-xl mx-auto shadow-sm">
                  <Heart size={48} className="mx-auto text-gray-300 opacity-80" />
                  <h3 className="font-bold text-lg text-gray-700">Wishlist is empty</h3>
                  <p className="text-sm">
                    Favorite products by clicking the heart button on listing cards in the shop catalog.
                  </p>
                  <Button
                    onClick={() => setActiveTab("browse")}
                    className="bg-green-700 text-white rounded-xl font-bold px-6"
                  >
                    Go Browse Store
                  </Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {wishlistedProducts.map((product) => (
                    <div key={product.id} className="relative group">
                      <ProductCard
                        product={product}
                        onViewDetails={setSelectedProduct}
                        onViewSeller={setSelectedSellerId}
                      />
                      
                      {/* Move to Cart overlay control */}
                      <div className="absolute top-2 left-2 z-20">
                        <Button
                          size="xs"
                          onClick={() => handleMoveToCart(product)}
                          className="bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded-lg px-2 py-1 flex items-center gap-1 shadow-md"
                        >
                          <ShoppingBag size={11} /> Move to Cart
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3.5: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">My Orders & Shipments</h2>
              
              {loadingOrders ? (
                <div className="text-center py-10 text-gray-500">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-150 text-gray-400 space-y-4 max-w-xl mx-auto shadow-sm">
                  <ClipboardList size={48} className="mx-auto text-gray-300 opacity-80" />
                  <h3 className="font-bold text-lg text-gray-700">No orders placed yet</h3>
                  <p className="text-sm">
                    Go browse our marketplace catalog to order fresh farm produce, soil inputs, watering systems, or hydroponics equipment.
                  </p>
                  <Button
                    onClick={() => setActiveTab("browse")}
                    className="bg-green-700 text-white rounded-xl font-bold px-6"
                  >
                    Browse Marketplace
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <OrderCard
                      key={ord.id}
                      order={ord}
                      role="customer"
                      onCancel={handleOrderCancel}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECENTLY VIEWED */}
          {activeTab === "recent" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Recently Viewed Items</h2>
              
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm mb-6 flex items-start gap-4">
                <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl shrink-0">
                  <Bookmark size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Recommendations System</h3>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Recently viewed items are tracked client-side in the current session. AgriTech AI uses these metrics to optimize farming product search recommendations dynamically matched to your Hybrid Terrace Planner specifications.
                  </p>
                </div>
              </div>

              {/* Display mock list of 2 items */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 opacity-80">
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs relative">
                  <img
                    src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=600&q=80"
                    alt="Seeds"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="p-4 bg-white space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Seeds & Plants</span>
                    <h4 className="font-bold text-gray-800 text-sm">Heirloom Tomato Seeds</h4>
                    <p className="font-extrabold text-green-750 text-sm">₹45.00</p>
                    <div className="text-[10px] text-gray-400 pt-1 border-t flex justify-between">
                      <span>Viewed 10m ago</span>
                      <span className="text-green-600 font-bold">In Stock</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs relative">
                  <img
                    src="https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&w=600&q=80"
                    alt="Compost"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="p-4 bg-white space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Organic Farming Inputs</span>
                    <h4 className="font-bold text-gray-800 text-sm">Premium Cocopeat block</h4>
                    <p className="font-extrabold text-green-750 text-sm">₹120.00</p>
                    <div className="text-[10px] text-gray-400 pt-1 border-t flex justify-between">
                      <span>Viewed 1h ago</span>
                      <span className="text-green-600 font-bold">In Stock</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SELLER CENTER */}
          {activeTab === "seller_center" && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {!isSeller ? (
                <div className="max-w-3xl mx-auto space-y-6 bg-white border border-gray-150 p-8 rounded-3xl shadow-sm">
                  <div>
                    <h2 className="text-2xl font-black text-gray-800">Become a Seller on Namma Kadai</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Register your home nursery or terrace garden business to start selling seeds, tools, organic compost, or fresh produce directly to other local growers.
                    </p>
                  </div>
                  <SellerForm onSuccess={handleBecomeSellerSuccess} />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Shop Details Header */}
                  <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-800">{sellerProfile?.businessName}</h2>
                        <span className="text-[10px] bg-green-100 border border-green-200 text-green-850 font-bold px-2 py-0.5 rounded-full capitalize">
                          {sellerProfile?.sellerType}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 font-medium">{sellerProfile?.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {sellerActiveTab === "products" && sellerProfile?.verificationStatus === "approved" && (
                        <Button
                          onClick={() => {
                            setEditingSellerProduct(undefined);
                            setShowSellerProductForm(true);
                          }}
                          className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5"
                        >
                          <Plus size={14} /> Add Product
                        </Button>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Verification:</span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                          sellerProfile?.verificationStatus === "approved"
                            ? "bg-green-50 border-green-200 text-green-800"
                            : sellerProfile?.verificationStatus === "rejected"
                            ? "bg-red-50 border-red-200 text-red-800"
                            : "bg-amber-50 border-amber-200 text-amber-800"
                        }`}>
                          {sellerProfile?.verificationStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sub Tabs Selector */}
                  <div className="flex border-b border-gray-200 gap-4 shrink-0">
                    <button
                      onClick={() => setSellerActiveTab("products")}
                      className={`flex items-center gap-1.5 pb-2 border-b-2 font-bold text-xs transition cursor-pointer ${
                        sellerActiveTab === "products"
                          ? "border-green-750 text-green-755 border-green-700"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      <Layers size={14} />
                      <span>My Products ({sellerProducts.length})</span>
                    </button>
                    <button
                      onClick={() => setSellerActiveTab("orders")}
                      className={`flex items-center gap-1.5 pb-2 border-b-2 font-bold text-xs transition cursor-pointer ${
                        sellerActiveTab === "orders"
                          ? "border-green-750 text-green-755 border-green-700"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      <ShoppingBag size={14} />
                      <span>Incoming Orders ({incomingOrders.length})</span>
                      {incomingOrders.filter(o => o.orderStatus === "Pending").length > 0 && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                          {incomingOrders.filter(o => o.orderStatus === "Pending").length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setSellerActiveTab("profile")}
                      className={`flex items-center gap-1.5 pb-2 border-b-2 font-bold text-xs transition cursor-pointer ${
                        sellerActiveTab === "profile"
                          ? "border-green-750 text-green-755 border-green-700"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      <Settings2 size={14} />
                      <span>Edit Shop Settings</span>
                    </button>
                  </div>

                  {/* Sub panels contents */}
                  <div>
                    {sellerActiveTab === "products" && (
                      <div className="space-y-6">
                        {loadingSellerProducts ? (
                          <div className="text-center py-10 text-gray-500">Loading listed products...</div>
                        ) : sellerProducts.length === 0 ? (
                          <div className="text-center py-16 bg-white border border-gray-150 text-gray-400 space-y-4 rounded-3xl shadow-xs max-w-xl mx-auto">
                            <Store size={40} className="mx-auto text-gray-300" />
                            <h3 className="font-bold text-lg text-gray-700">No products listed</h3>
                            <p className="text-sm">
                              {sellerProfile?.verificationStatus === "approved"
                                ? "List organic terrace produce or spare tools to begin."
                                : "Your shop registration is pending admin verification. You can list items but they will show in catalog only post validation."}
                            </p>
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sellerProducts.map((p) => (
                              <ProductCard
                                key={p.id}
                                product={p as any}
                                isOwner={true}
                                onEdit={(item) => {
                                  setEditingSellerProduct(item as any);
                                  setShowSellerProductForm(true);
                                }}
                                onDelete={handleSellerProductDelete}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {sellerActiveTab === "orders" && (
                      <div className="space-y-6">
                        <h3 className="text-lg font-bold text-gray-800">Incoming Shop Purchases</h3>
                        
                        {loadingIncomingOrders ? (
                          <div className="text-center py-10 text-gray-500">Loading incoming orders...</div>
                        ) : incomingOrders.length === 0 ? (
                          <div className="text-center py-16 bg-white rounded-3xl border border-gray-150 text-gray-400 space-y-4 max-w-xl mx-auto shadow-xs">
                            <ShoppingBag size={40} className="mx-auto text-gray-300" />
                            <h3 className="font-bold text-gray-750">No orders received</h3>
                            <p className="text-sm">Buyers will order listed products once they are approved by administration.</p>
                          </div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-6">
                            {incomingOrders.map((ord) => (
                              <OrderCard
                                key={ord.id}
                                order={ord}
                                role="seller"
                                onStatusChange={handleIncomingOrderStatusChange}
                                onCancel={handleIncomingOrderCancel}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {sellerActiveTab === "profile" && (
                      <SellerForm onSuccess={handleBecomeSellerSuccess} />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Global Modal handlers inside Customer Dashboard */}
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onViewSeller={setSelectedSellerId}
          />
        )}

        {selectedSellerId && (
          <SellerProfileModal
            sellerId={selectedSellerId}
            onClose={() => setSelectedSellerId(null)}
            onAddToCart={addToCart}
            onViewProductDetails={setSelectedProduct}
          />
        )}

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          cartItems={cartItems}
          onSuccess={handleCheckoutSuccess}
        />

        {/* Product Form Modal overlay for Customer-Seller listings */}
        {showSellerProductForm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <ProductForm
              product={editingSellerProduct as any}
              onSuccess={handleSellerProductFormSuccess}
              onCancel={() => {
                setShowSellerProductForm(false);
                setEditingSellerProduct(undefined);
              }}
            />
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 shrink-0">
          <p>© 2026 AgriTech AI Smart Urban Farming. All Rights Reserved.</p>
        </footer>

        {/* Global AI Shopping Assistant floating panel */}
        <AiShoppingAssistant />
      </div>
    </ProtectedRoute>
  );
}