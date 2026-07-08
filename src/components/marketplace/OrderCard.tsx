import React, { useState } from "react";
import { Order, OrderStatus } from "@/types/order";
import OrderTimeline from "./OrderTimeline";
import { useLanguage } from "@/components/common/LanguageContext";
import { Button } from "@/components/ui/button";
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Calendar, 
  CreditCard, 
  FileText,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Download
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaymentService } from "@/services/paymentService";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendOrderNotification } from "@/services/notificationService";

interface OrderCardProps {
  order: Order;
  role: "customer" | "seller" | "admin";
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
  onCancel?: (orderId: string) => void;
  onRetrySuccess?: () => void;
}

export default function OrderCard({
  order,
  role,
  onStatusChange,
  onCancel,
  onRetrySuccess,
}: OrderCardProps) {
  const { t } = useLanguage();
  const [updating, setUpdating] = useState(false);

  const formattedDate = order.createdAt?.seconds 
    ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
    : "Recently placed";

  // Helper to determine status color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 border-amber-200 text-amber-800";
      case "Confirmed":
        return "bg-blue-100 border-blue-200 text-blue-800";
      case "Packed":
        return "bg-purple-100 border-purple-200 text-purple-800";
      case "Shipped":
        return "bg-indigo-100 border-indigo-200 text-indigo-800";
      case "Out for Delivery":
        return "bg-orange-100 border-orange-200 text-orange-800";
      case "Delivered":
        return "bg-green-100 border-green-200 text-green-800";
      case "Cancelled":
        return "bg-red-100 border-red-200 text-red-800";
      default:
        return "bg-gray-100 border-gray-200 text-gray-800";
    }
  };

  const handleStatusUpdate = async (status: OrderStatus) => {
    if (!onStatusChange) return;
    setUpdating(true);
    try {
      await onStatusChange(order.id!, status);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelClick = async () => {
    if (!onCancel) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setUpdating(true);
    try {
      await onCancel(order.id!);
    } finally {
      setUpdating(false);
    }
  };

  // Payment retries execution
  const handlePaymentRetry = async () => {
    setUpdating(true);
    try {
      const scriptLoaded = await PaymentService.loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK script load error. Check your connection.");
      }

      // Initialize order session from backend
      const rzpSession = await PaymentService.createRazorpayOrder(order.customerId, order.totalAmount);

      const options = {
        key: rzpSession.key || "rzp_test_placeholder",
        amount: rzpSession.amount,
        currency: rzpSession.currency,
        name: "AgriTech AI Platform",
        description: `Retry Payment for Order #${order.id?.slice(-6).toUpperCase()}`,
        order_id: rzpSession.id,
        handler: async function (response: any) {
          setUpdating(true);
          try {
            const isVerified = await PaymentService.verifyPaymentSignature(
              rzpSession.id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );

            if (isVerified) {
              const orderRef = doc(db, "orders", order.id!);
              await updateDoc(orderRef, {
                paymentStatus: "Paid",
                orderStatus: "Confirmed",
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: rzpSession.id,
                paymentTimestamp: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
              alert("Payment secure & verified! Order confirmed.");
              
              sendOrderNotification(
                order.customerId,
                "Payment Successful",
                `Payment for Order #${order.id?.slice(-6).toUpperCase()} was successful!`,
                "/customer"
              );

              if (onRetrySuccess) onRetrySuccess();
            } else {
              throw new Error("Verification failed.");
            }
          } catch (err: any) {
            alert("Retry payment verification failed: " + err.message);
          } finally {
            setUpdating(false);
          }
        },
        prefill: {
          name: order.customerName,
          contact: order.contactNumber,
        },
        theme: {
          color: "#15803d",
        },
        modal: {
          ondismiss: function () {
            alert("Payment check cancelled.");
            setUpdating(false);
          }
        }
      };

      if (rzpSession.simulated) {
        const proceed = confirm("SIMULATOR: Click OK to simulate successful retry payment check.");
        if (proceed) {
          options.handler({
            razorpay_payment_id: `pay_sim_retry_${Math.random().toString(36).substring(2, 11)}`,
            razorpay_signature: "simulated_signature"
          });
        } else {
          options.modal.ondismiss();
        }
      } else {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }

    } catch (err: any) {
      alert("Failed to initialize retry session: " + err.message);
      setUpdating(false);
    }
  };

  // Compile and download plain text invoice
  const handleDownloadInvoice = () => {
    const invoiceContent = `
===============================================
              NAMMA KADAI INVOICE
===============================================
Order ID: ${order.id?.toUpperCase()}
Date: ${formattedDate}
Customer Name: ${order.customerName}
Contact Phone: ${order.contactNumber}
Shipping Address: ${order.deliveryAddress}
-----------------------------------------------
ITEMS ORDERED:
${order.products.map(p => `- ${p.productName} (x${p.quantity}): ₹${(p.price * p.quantity).toFixed(2)}`).join("\n")}
-----------------------------------------------
Subtotal: ₹${order.subtotal.toFixed(2)}
GST (5%): ₹${(order.subtotal * 0.05).toFixed(2)}
Delivery Charge: ${order.deliveryCharge === 0 ? "FREE" : `₹${order.deliveryCharge.toFixed(2)}`}
Grand Total: ₹${order.totalAmount.toFixed(2)}
-----------------------------------------------
Payment Method: ${order.paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay"}
Payment Status: ${order.paymentStatus.toUpperCase()}
Payment Reference: ${order.paymentId || "N/A"}
===============================================
Thank you for supporting urban growers!
`;
    const blob = new Blob([invoiceContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${order.id?.slice(-6).toUpperCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-150 shadow-sm hover:shadow-md transition p-6 space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-wrap justify-between items-center gap-3 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-800 text-base">
              Order #{order.id?.slice(-6).toUpperCase()}
            </span>
            <Badge className={`capitalize font-bold text-[10px] py-0.5 px-2 rounded-full border ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
            <span className="flex items-center gap-1">
              <Calendar size={13} /> {formattedDate}
            </span>
            <span>
              {role === "customer" 
                ? `Seller: ${order.sellerName}` 
                : `Buyer: ${order.customerName}`}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs text-gray-400 font-medium block">Grand Total</span>
          <span className="text-xl font-black text-green-800">
            ₹{order.totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Visual Tracking Timeline */}
      <OrderTimeline status={order.orderStatus} />

      {/* Products Sublist */}
      <div className="space-y-3">
        <h4 className="font-bold text-gray-800 text-xs flex items-center gap-1.5 uppercase tracking-wider">
          <ShoppingBag size={14} className="text-green-700" />
          <span>Items Ordered ({order.products.length})</span>
        </h4>
        <div className="divide-y divide-gray-100 bg-gray-50/50 rounded-2xl border p-4 space-y-3">
          {order.products.map((prod) => (
            <div key={prod.productId} className="flex gap-3 items-center py-2 first:pt-0 last:pb-0">
              <img
                src={prod.image || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80"}
                alt={prod.productName}
                className="w-10 h-10 object-cover rounded-lg border shrink-0 bg-white"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-855 text-xs truncate">{prod.productName}</p>
                <p className="text-[10px] text-gray-400 font-semibold">
                  Unit: ₹{prod.price.toFixed(2)} | Qty: {prod.quantity}
                </p>
              </div>
              <span className="font-extrabold text-gray-800 text-xs">
                ₹{(prod.price * prod.quantity).toFixed(2)}
              </span>
            </div>
          ))}

          {/* Pricing detail list */}
          <div className="pt-3 border-t border-dashed border-gray-200 text-xs text-gray-500 font-medium space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (5%)</span>
              <span>₹{(order.subtotal * 0.05).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>
                {order.deliveryCharge === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${order.deliveryCharge.toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Address & Payment block */}
      <div className="grid md:grid-cols-2 gap-4 text-xs bg-gray-50/20 p-4 rounded-2xl border border-gray-100">
        <div className="space-y-2">
          <p className="font-bold text-gray-700 flex items-center gap-1.5">
            <MapPin size={13} className="text-green-600" /> Shipping Address
          </p>
          <p className="text-gray-600 font-medium leading-relaxed pl-4.5">{order.deliveryAddress}</p>
          <p className="text-gray-600 font-medium flex items-center gap-1.5 pl-4.5">
            <Phone size={11} /> {order.contactNumber}
          </p>
        </div>

        <div className="space-y-2.5">
          <div>
            <p className="font-bold text-gray-700 flex items-center gap-1.5">
              <CreditCard size={13} className="text-green-600" /> Payment Info
            </p>
            <div className="pl-4.5 mt-1 font-semibold text-gray-600 space-y-1">
              <p>Method: {order.paymentMethod === "COD" ? "Cash on Delivery" : "Razorpay"}</p>
              <p className="flex items-center gap-2">
                Status: 
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                  order.paymentStatus === "Paid" || order.paymentStatus === "paid"
                    ? "bg-green-50 border-green-200 text-green-700" 
                    : order.paymentStatus === "Failed" || order.paymentStatus === "failed"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}>
                  {order.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          {order.notes && (
            <div>
              <p className="font-bold text-gray-700 flex items-center gap-1.5">
                <FileText size={13} className="text-green-600" /> Order Notes
              </p>
              <p className="text-gray-500 font-medium italic pl-4.5 mt-0.5">"{order.notes}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Role-based action controls */}
      <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
        
        {/* Customer Actions */}
        {role === "customer" && (
          <>
            {(order.paymentStatus === "Failed" || order.paymentStatus === "failed" || (order.paymentMethod === "Razorpay" && order.paymentStatus === "Pending")) && (
              <Button
                disabled={updating}
                onClick={handlePaymentRetry}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                <CreditCard size={14} className="mr-1.5 animate-bounce" /> Retry Payment
              </Button>
            )}
            {(order.paymentStatus === "Paid" || order.paymentStatus === "paid") && (
              <Button
                onClick={handleDownloadInvoice}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-750 rounded-xl font-bold text-xs"
              >
                <Download size={14} className="mr-1.5" /> Download Invoice
              </Button>
            )}
            {order.orderStatus === "Pending" && (
              <Button
                variant="destructive"
                disabled={updating}
                onClick={handleCancelClick}
                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-650 rounded-xl font-bold text-xs"
              >
                <XCircle size={14} className="mr-1.5" /> Cancel Order
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => alert("Reorder (Placeholder): Moving products back to your active cart.")}
              className="rounded-xl border-gray-255 text-gray-600 font-bold text-xs"
            >
              <RotateCcw size={14} className="mr-1.5" /> Reorder
            </Button>
          </>
        )}

        {/* Seller Actions */}
        {role === "seller" && (
          <>
            {order.orderStatus === "Pending" && (
              <>
                <Button
                  disabled={updating}
                  onClick={() => handleStatusUpdate("Confirmed")}
                  className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-xs"
                >
                  <CheckCircle size={14} className="mr-1.5" /> Accept Order
                </Button>
                <Button
                  variant="destructive"
                  disabled={updating}
                  onClick={handleCancelClick}
                  className="bg-red-50 hover:bg-red-100 border-red-200 text-red-650 rounded-xl font-bold text-xs"
                >
                  <XCircle size={14} className="mr-1.5" /> Reject Order
                </Button>
              </>
            )}
            {order.orderStatus === "Confirmed" && (
              <Button
                disabled={updating}
                onClick={() => handleStatusUpdate("Packed")}
                className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs"
              >
                <ShoppingBag size={14} className="mr-1.5" /> Mark as Packed
              </Button>
            )}
            {order.orderStatus === "Packed" && (
              <Button
                disabled={updating}
                onClick={() => handleStatusUpdate("Shipped")}
                className="bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs"
              >
                <Truck size={14} className="mr-1.5" /> Mark as Shipped
              </Button>
            )}
            {order.orderStatus === "Shipped" && (
              <Button
                disabled={updating}
                onClick={() => handleStatusUpdate("Out for Delivery")}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs"
              >
                <Truck size={14} className="mr-1.5" /> Mark Out for Delivery
              </Button>
            )}
            {order.orderStatus === "Out for Delivery" && (
              <Button
                disabled={updating}
                onClick={() => handleStatusUpdate("Delivered")}
                className="bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-xs"
              >
                <CheckCircle size={14} className="mr-1.5" /> Mark as Delivered
              </Button>
            )}
          </>
        )}

        {/* Admin Actions */}
        {role === "admin" && (
          <>
            {order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && (
              <Button
                variant="destructive"
                disabled={updating}
                onClick={handleCancelClick}
                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-650 rounded-xl font-bold text-xs"
              >
                <AlertTriangle size={14} className="mr-1.5" /> Cancel Order (Admin Override)
              </Button>
            )}
          </>
        )}

      </div>

    </div>
  );
}
