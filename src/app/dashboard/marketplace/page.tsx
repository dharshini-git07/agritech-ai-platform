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
  Plus,
  Heart,
  Eye,
  Trash,
  Minus,
  CreditCard,
  ClipboardList,
  Bookmark
} from "lucide-react";
import { Order, OrderStatus } from "@/types/order";
import { getSellerOrders, updateOrderStatus, cancelOrder, getCustomerOrders } from "@/services/orderService";
import OrderCard from "@/components/marketplace/OrderCard";
import { useMarketplace } from "@/components/marketplace/MarketplaceContext";
import MarketStorefront from "@/components/marketplace/MarketStorefront";
import CheckoutModal from "@/components/marketplace/CheckoutModal";

type SubView = "products" | "profile" | "orders" | "browse" | "cart" | "wishlist" | "my_orders";

export default function SellerDashboard() {
  const { t } = useLanguage();
  const { 
    cartItems, 
    wishlistIds, 
    products: allProducts, 
    updateCartQuantity, 
    removeCartItem, 
    clearCart, 
    addToCart,
    toggleWishlist,
    refreshProducts
  } = useMarketplace();

  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  
  // Products Management
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Orders Management
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [sellerOrderTab, setSellerOrderTab] = useState<"all" | "paid" | "pending">("all");

  // Buyer Orders
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingCustomerOrders, setLoadingCustomerOrders] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

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
          await loadCustomerOrdersData(uid);
        } else {
          setIsSeller(false);
          setSellerProfile(null);
          await loadCustomerOrdersData(uid);
        }
      }
    } catch (err) {
      console.error("Error checking seller status:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerOrdersData = async (uid: string) => {
    setLoadingCustomerOrders(true);
    try {
      const list = await getCustomerOrders(uid);
      setCustomerOrders(list);
    } catch (err) {
      console.error("Error loading customer orders:", err);
    } finally {
      setLoadingCustomerOrders(false);
    }
  };

  const handleCustomerOrderCancel = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
      alert("Order cancelled successfully.");
      const user = auth.currentUser;
      if (user) {
        await loadCustomerOrdersData(user.uid);
        await refreshProducts(); // Reload global context products
      }
    } catch (err: any) {
      alert("Failed to cancel order: " + err.message);
    }
  };

  const handleCheckoutSuccess = async () => {
    setShowCheckoutModal(false);
    const user = auth.currentUser;
    if (user) {
      await loadCustomerOrdersData(user.uid);
      await refreshProducts();
    }
    setActiveTab("my_orders"); // Switch to buyer orders list on success
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
    <div className="space-y-8 p-4 md:p-8 w-full max-w-full overflow-hidden">
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
      <div className="flex border-b border-gray-200 overflow-x-auto select-none scrollbar-none shrink-0 whitespace-nowrap">
        <button
          onClick={() => setActiveTab("products")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "products"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Layers size={14} />
          <span>My Products (Sell)</span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "orders"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ShoppingBag size={14} />
          <span>Incoming Orders</span>
          {orders.filter(o => o.orderStatus === "Pending").length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {orders.filter(o => o.orderStatus === "Pending").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "profile"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Settings2 size={14} />
          <span>Store Settings</span>
        </button>

        {/* Crossover Buying Tabs */}
        <div className="h-6 w-px bg-gray-200 self-center mx-2 shrink-0" />
        
        <button
          onClick={() => setActiveTab("browse")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "browse"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Store size={14} />
          <span>Browse Marketplace</span>
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "cart"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ShoppingBag size={14} />
          <span>My Cart</span>
          {cartItems.length > 0 && (
            <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "wishlist"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Heart size={14} />
          <span>Wishlist</span>
          {wishlistIds.length > 0 && (
            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {wishlistIds.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("my_orders")}
          className={`flex items-center gap-1.5 px-4 py-3 border-b-2 font-bold text-xs transition whitespace-nowrap cursor-pointer ${
            activeTab === "my_orders"
              ? "border-green-700 text-green-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <ClipboardList size={14} />
          <span>My Purchases</span>
          {customerOrders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              {customerOrders.filter(o => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length} active
            </span>
          )}
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

        {activeTab === "orders" && (() => {
          const filteredOrders = orders.filter((ord) => {
            if (sellerOrderTab === "paid") {
              return ord.paymentStatus === "Paid" || ord.paymentStatus === "paid";
            }
            if (sellerOrderTab === "pending") {
              return ord.paymentStatus === "Pending" || ord.paymentStatus === "pending" || ord.paymentStatus === "Failed" || ord.paymentStatus === "failed";
            }
            return true;
          });

          return (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <h3 className="text-xl font-bold text-gray-800">Incoming Customer Orders</h3>
                
                {/* Payment status tab group selection */}
                <div className="flex bg-white border border-gray-150 rounded-xl overflow-hidden shadow-2xs">
                  <button
                    onClick={() => setSellerOrderTab("all")}
                    className={`px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      sellerOrderTab === "all" ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    All Orders
                  </button>
                  <button
                    onClick={() => setSellerOrderTab("paid")}
                    className={`px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      sellerOrderTab === "paid" ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Paid Orders
                  </button>
                  <button
                    onClick={() => setSellerOrderTab("pending")}
                    className={`px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                      sellerOrderTab === "pending" ? "bg-green-700 text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Pending Payments
                  </button>
                </div>
              </div>
              
              {loadingOrders ? (
                <div className="text-center py-10 text-gray-500">Loading incoming orders...</div>
              ) : filteredOrders.length === 0 ? (
                <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-150 p-12 text-center text-gray-400 space-y-4">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 opacity-80" />
                  <h3 className="font-bold text-lg text-gray-700">No orders received yet</h3>
                  <p className="text-sm">
                    As customers purchase your catalog items, their shipments will show up here. You can manage status updates, accept, or cancel orders directly.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredOrders.map((ord) => (
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
          );
        })()}

        {activeTab === "profile" && (
          <SellerForm onSuccess={() => auth.currentUser && checkSellerStatus(auth.currentUser.uid)} />
        )}

        {activeTab === "browse" && <MarketStorefront />}

        {activeTab === "cart" && (() => {
          const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
          const gst = subtotal * 0.05; // 5% GST
          
          // Calculate delivery per seller
          const groupedBySeller: { [sellerId: string]: number } = {};
          for (const item of cartItems) {
            groupedBySeller[item.product.sellerId] = (groupedBySeller[item.product.sellerId] || 0) + item.product.price * item.quantity;
          }
          let totalDelivery = 0;
          for (const sId in groupedBySeller) {
            if (groupedBySeller[sId] < 500) {
              totalDelivery += 50;
            }
          }
          const total = subtotal + gst + totalDelivery;

          return (
            <div className="max-w-5xl mx-auto space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Shopping Cart</h2>

              {cartItems.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-155 text-gray-400 space-y-4 max-w-xl mx-auto">
                  <ShoppingBag size={48} className="mx-auto text-gray-300 opacity-80" />
                  <h3 className="font-bold text-lg text-gray-700">Your cart is empty</h3>
                  <p className="text-sm">
                    Browse the Namma Kadai catalog to discover seeds, organic compost, hydroponics modules, and fresh vegetables.
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
                        className="text-xs text-red-650 hover:text-red-700 font-bold transition flex items-center gap-1 cursor-pointer"
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
                              className="w-16 h-16 object-contain p-1 rounded-xl border shrink-0 bg-white"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-800 text-sm truncate">
                                {item.product.productName}
                              </h4>
                              <p className="text-xs text-gray-400 font-medium capitalize mt-0.5">
                                {t("sellerLabel")}: {item.product.businessName} ({item.product.sellerType})
                              </p>
                              <p className="text-xs text-gray-400 font-medium">
                                {t("unitPriceLabel")}: ₹{item.product.price.toFixed(2)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-gray-205 rounded-lg overflow-hidden shrink-0">
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
                                    alert(t("stockLimitAlert"));
                                  }
                                }}
                                className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            <span className="font-extrabold text-green-755 text-sm w-20 text-right">
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
                    <h3 className="font-bold text-gray-800 text-base border-b pb-3">{t("orderSummary")}</h3>
                    
                    <div className="space-y-2.5 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>{t("subtotalLabel")}</span>
                        <span className="font-semibold text-gray-850">₹{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes (5% GST)</span>
                        <span className="font-semibold text-gray-850">₹{gst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("deliveryChargeLabel")}</span>
                        <span className="font-semibold text-gray-855">
                          {totalDelivery === 0 ? <span className="text-green-600 font-bold">{t("freeLabel")}</span> : `₹${totalDelivery.toFixed(2)}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3 font-extrabold text-gray-800">
                      <span>{t("totalLabel")}</span>
                      <span className="text-xl text-green-800">₹{total.toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={() => setShowCheckoutModal(true)}
                      className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4"
                    >
                      <CreditCard size={18} />
                      <span>{t("placeOrderButton")}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {activeTab === "wishlist" && (() => {
          const wishlistedProducts = allProducts.filter((p) => wishlistIds.includes(p.id!));
          const handleMoveToCart = async (product: any) => {
            await addToCart(product);
            await toggleWishlist(product.id!); // Remove from wishlist on move to cart
          };

          return (
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
          );
        })()}

        {activeTab === "my_orders" && (
          <div className="max-w-5xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">My Orders & Shipments</h2>
            
            {loadingCustomerOrders ? (
              <div className="text-center py-10 text-gray-500">Loading orders...</div>
            ) : customerOrders.length === 0 ? (
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
                {customerOrders.map((ord) => (
                  <OrderCard
                    key={ord.id}
                    order={ord}
                    role="customer"
                    onCancel={handleCustomerOrderCancel}
                  />
                ))}
              </div>
            )}
          </div>
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  );
}
