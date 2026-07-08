export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "COD" | "Razorpay" | "UPI" | "Stripe";

export interface OrderProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id?: string;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  products: OrderProduct[];
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded" | "Cancelled" | "pending" | "paid" | "failed";
  orderStatus: OrderStatus;
  deliveryAddress: string;
  contactNumber: string;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
  latitude?: number;
  longitude?: number;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentTimestamp?: any;
}
