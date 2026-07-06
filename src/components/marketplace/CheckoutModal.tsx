import React, { useState } from "react";
import { CartItem } from "@/types/marketplace";
import { PaymentMethod } from "@/types/order";
import { createOrdersFromCheckout } from "@/services/orderService";
import { auth } from "@/lib/firebase";
import { X, CreditCard, ShoppingBag, Landmark, Send, ClipboardList } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/common/LanguageContext";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onSuccess: () => void;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onSuccess,
}: CheckoutModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  
  // Checkout Form Details
  const [customerName, setCustomerName] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");

  if (!isOpen) return null;

  // Invoice parameters
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

  const grandTotal = subtotal + gst + totalDelivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !deliveryAddress || !contactNumber) {
      alert(t("selectImageAlert"));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("Authentication required.");
      return;
    }

    setLoading(true);
    try {
      await createOrdersFromCheckout(
        user.uid,
        {
          customerName,
          deliveryAddress,
          contactNumber,
          notes,
          paymentMethod,
        },
        cartItems
      );
      alert(t("checkoutSuccessAlert"));
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to place order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Checkout Dialog Panel */}
      <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-150 p-8 grid md:grid-cols-5 gap-8 animate-in zoom-in-95 duration-250">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Column 1-3: Checkout details form */}
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-5">
          <div>
            <h3 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <ClipboardList className="text-green-700" size={24} />
              <span>{t("myOrdersShipments")}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">{t("addressDesc")}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t("fullNamePlaceholder")} *</label>
              <Input
                type="text"
                placeholder={t("fullNamePlaceholder")}
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="rounded-xl border-gray-255 focus:border-green-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t("contactNumberLabel")} *</label>
              <Input
                type="tel"
                placeholder={t("contactNumberLabel")}
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="rounded-xl border-gray-255 focus:border-green-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">{t("address")} *</label>
              <textarea
                placeholder={t("enterAddressPlaceholder")}
                required
                rows={3}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full bg-white border border-gray-255 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Order Notes (Optional)</label>
              <textarea
                placeholder="Instructions for delivery agent, gate codes, etc..."
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t("paymentMethodLabel")}</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-3 p-3.5 border border-green-500 bg-green-50/50 rounded-xl cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t("codLabel")}</p>
                  </div>
                </label>
 
                {/* Placeholders for digital gateways */}
                <div className="flex items-center gap-3 p-3.5 border border-gray-150 bg-gray-50 rounded-xl opacity-60 cursor-not-allowed">
                  <input type="radio" name="payment" disabled className="w-4 h-4 cursor-not-allowed" />
                  <div>
                    <p className="text-sm font-bold text-gray-500">{t("onlinePaymentLabel")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold flex items-center justify-center gap-2"
          >
            <Send size={16} />
            <span>{loading ? "..." : t("placeOrderButton")}</span>
          </Button>
        </form>

        {/* Column 4-5: Order summary sidebar */}
        <div className="md:col-span-2 bg-gray-50 rounded-3xl p-6 border border-gray-150 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h4 className="font-extrabold text-gray-800 text-base flex items-center gap-2 border-b pb-3 shrink-0">
              <ShoppingBag size={18} className="text-green-700" />
              <span>Purchase Summary</span>
            </h4>

            {/* List items */}
            <div className="space-y-3 overflow-y-auto max-h-[40vh] pr-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-3 text-xs bg-white p-2.5 rounded-xl border border-gray-100">
                  <img
                    src={item.product.images?.[0]}
                    alt={item.product.productName}
                    className="w-10 h-10 object-cover rounded-lg border shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-800 truncate">{item.product.productName}</p>
                    <p className="text-gray-400 font-medium">Qty: {item.quantity} x ₹{item.product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing detail list */}
          <div className="border-t border-gray-200 pt-4 space-y-2.5 text-xs text-gray-600 font-medium">
            <div className="flex justify-between">
              <span>{t("subtotalLabel")}</span>
              <span className="text-gray-800 font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span className="text-gray-800 font-semibold">₹{gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("deliveryChargeLabel")}</span>
              <span className="text-gray-855 font-bold">
                {totalDelivery === 0 ? <span className="text-green-600">{t("freeLabel")}</span> : `₹${totalDelivery.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200 text-sm font-extrabold text-gray-800">
              <span>{t("totalLabel")}</span>
              <span className="text-lg text-green-800">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
