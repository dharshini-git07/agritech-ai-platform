import React from "react";
import { CartItem } from "@/types/marketplace";
import { X, ShoppingBag, Plus, Minus, Trash, CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/common/LanguageContext";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const gst = subtotal * 0.05; // 5% GST
  const delivery = subtotal > 500 ? 0 : subtotal > 0 ? 50 : 0;
  const total = subtotal + gst + delivery;

  const handleCheckout = () => {
    alert("Buy Now (Placeholder): Order placed successfully! The seller will contact you for delivery details.");
    onClearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-300">
      {/* Click outside to close */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Drawer content panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-gray-100 animate-in slide-in-from-right duration-350">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-green-700" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Shopping Cart</h3>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
              <ShoppingBag size={48} className="opacity-40" />
              <p className="font-semibold text-gray-500">Your cart is empty</p>
              <p className="text-xs text-center px-6">Add organic terrace farming products or fresh veggies to your cart to get started.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex gap-4 p-3 rounded-2xl border border-gray-100 bg-white hover:border-green-150 transition"
              >
                <img
                  src={item.product.images?.[0]}
                  alt={item.product.productName}
                  className="w-16 h-16 object-cover rounded-xl border border-gray-50 shrink-0"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <h4 className="font-bold text-gray-800 text-sm truncate">
                        {item.product.productName}
                      </h4>
                      <button
                        onClick={() => onRemoveItem(item.product.id!)}
                        className="text-gray-400 hover:text-red-500 p-0.5 transition cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">
                      Seller: {item.product.businessName}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-green-750 text-sm">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </span>

                    {/* Quantity controls */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id!, item.quantity - 1)}
                        className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-bold text-gray-700 w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity < item.product.quantity) {
                            onUpdateQuantity(item.product.id!, item.quantity + 1);
                          } else {
                            alert("Cannot exceed available stock limit!");
                          }
                        }}
                        className="p-1 hover:bg-gray-50 text-gray-500 cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary panel */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 shrink-0 space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-800">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (5%)</span>
                <span className="font-semibold text-gray-800">₹{gst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-semibold text-gray-800">
                  {delivery === 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${delivery.toFixed(2)}`}
                </span>
              </div>
              {delivery > 0 && (
                <p className="text-[10px] text-gray-400 italic text-right">
                  Add ₹{(500 - subtotal).toFixed(2)} more for FREE delivery
                </p>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-gray-850">
              <span className="font-extrabold text-base">Grand Total</span>
              <span className="font-extrabold text-2xl text-green-800">₹{total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onClearCart}
                className="py-3 rounded-xl font-bold border-gray-250 text-gray-600"
              >
                Clear Cart
              </Button>
              <Button
                onClick={handleCheckout}
                className="py-3 rounded-xl font-bold bg-green-700 hover:bg-green-800 text-white flex items-center justify-center gap-2"
              >
                <CreditCard size={16} />
                <span>Buy Now</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
