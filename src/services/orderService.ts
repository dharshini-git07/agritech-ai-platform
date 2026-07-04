import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus, PaymentMethod, OrderProduct } from "@/types/order";
import { CartItem } from "@/types/marketplace";
import { verifyAndDeductStock, restoreStock } from "./inventoryService";
import { sendOrderNotification } from "./notificationService";
import { saveFirestoreCart } from "./cartService";

// 1. Transaction-based multi-vendor order checkout creation
export async function createOrdersFromCheckout(
  userId: string,
  checkoutData: {
    customerName: string;
    deliveryAddress: string;
    contactNumber: string;
    notes?: string;
    paymentMethod: PaymentMethod;
  },
  cartItems: CartItem[]
): Promise<void> {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cannot checkout an empty shopping cart.");
  }

  // Group cart items by sellerId for vendor-split orders
  const groupedBySeller: { [sellerId: string]: CartItem[] } = {};
  for (const item of cartItems) {
    const sId = item.product.sellerId;
    if (!groupedBySeller[sId]) {
      groupedBySeller[sId] = [];
    }
    groupedBySeller[sId].push(item);
  }

  // Run the checkout inside a single Firestore transaction for atomicity
  await runTransaction(db, async (transaction) => {
    // A. Deduct stock for all items
    const stockDeductionItems = cartItems.map((item) => ({
      productId: item.product.id!,
      quantity: item.quantity,
    }));
    await verifyAndDeductStock(transaction, stockDeductionItems);

    // B. Create orders for each seller group
    for (const sellerId in groupedBySeller) {
      const groupItems = groupedBySeller[sellerId];
      const sampleItem = groupItems[0];
      
      const orderProducts: OrderProduct[] = groupItems.map((item) => ({
        productId: item.product.id!,
        productName: item.product.productName,
        quantity: item.quantity,
        price: item.product.price,
        image: item.product.images?.[0] || "",
      }));

      const subtotal = groupItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      );
      
      // ₹50 delivery charge per seller if subtotal from that seller is < ₹500
      const deliveryCharge = subtotal >= 500 ? 0 : 50;
      const totalAmount = subtotal + (subtotal * 0.05) + deliveryCharge; // Subtotal + 5% GST + Delivery

      const orderRef = doc(collection(db, "orders"));
      
      const orderData: Omit<Order, "id"> = {
        customerId: userId,
        customerName: checkoutData.customerName,
        sellerId: sellerId,
        sellerName: sampleItem.product.businessName || "Farmer",
        products: orderProducts,
        subtotal,
        deliveryCharge,
        totalAmount,
        paymentMethod: checkoutData.paymentMethod,
        paymentStatus: "pending",
        orderStatus: "Pending",
        deliveryAddress: checkoutData.deliveryAddress,
        contactNumber: checkoutData.contactNumber,
        notes: checkoutData.notes || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(orderRef, orderData);
    }

    // C. Clear the customer's cart
    const cartRef = doc(db, "carts", userId);
    transaction.set(cartRef, {
      items: [],
      updatedAt: serverTimestamp(),
    });
  });

  // D. Post-transaction: Send notifications asynchronously
  for (const sellerId in groupedBySeller) {
    sendOrderNotification(
      sellerId,
      "New Order Received",
      `You have received a new customer order on Namma Kadai.`
    );
  }
}

// 2. Fetch Customer Orders
export async function getCustomerOrders(userId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, "id">),
    }));

    return list
      .filter((order) => order.customerId === userId)
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
  } catch (err) {
    console.error("Error loading customer orders:", err);
    return [];
  }
}

// 3. Fetch Seller Orders
export async function getSellerOrders(sellerId: string): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, "id">),
    }));

    return list
      .filter((order) => order.sellerId === sellerId)
      .sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });
  } catch (err) {
    console.error("Error loading seller orders:", err);
    return [];
  }
}

// 4. Fetch All Orders (Admin)
export async function getAllOrders(): Promise<Order[]> {
  try {
    const q = query(collection(db, "orders"));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Order, "id">),
    }));

    return list.sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
  } catch (err) {
    console.error("Error loading all orders:", err);
    return [];
  }
}

// 5. Update Order Status
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);
  
  if (!orderSnap.exists()) {
    throw new Error("Order not found");
  }

  const orderData = orderSnap.data() as Order;
  const isDelivered = status === "Delivered";

  await runTransaction(db, async (transaction) => {
    transaction.update(orderRef, {
      orderStatus: status,
      paymentStatus: isDelivered ? "paid" : orderData.paymentStatus,
      updatedAt: serverTimestamp(),
    });
  });

  // Send status change notification to customer
  await sendOrderNotification(
    orderData.customerId,
    isDelivered ? "Order Delivered" : status === "Confirmed" ? "Order Confirmed" : status === "Packed" ? "Order Packed" : "Order Confirmed",
    `Your order status from "${orderData.sellerName}" has been updated to: ${status}.`
  );
}

// 6. Cancel Order (Restores deducted stock)
export async function cancelOrder(orderId: string): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  const orderSnap = await getDoc(orderRef);

  if (!orderSnap.exists()) {
    throw new Error("Order not found");
  }

  const orderData = orderSnap.data() as Order;

  if (orderData.orderStatus !== "Pending") {
    throw new Error("Only pending orders can be cancelled.");
  }

  // A. Restore Stock
  const stockItems = orderData.products.map((p) => ({
    productId: p.productId,
    quantity: p.quantity,
  }));
  await restoreStock(stockItems);

  // B. Update status to Cancelled
  await runTransaction(db, async (transaction) => {
    transaction.update(orderRef, {
      orderStatus: "Cancelled",
      paymentStatus: "failed",
      updatedAt: serverTimestamp(),
    });
  });

  // C. Notify Customer & Seller
  await sendOrderNotification(
    orderData.customerId,
    "Order Cancelled",
    `Your order with "${orderData.sellerName}" has been successfully cancelled.`
  );
  await sendOrderNotification(
    orderData.sellerId,
    "Order Cancelled",
    `Order ${orderId} has been cancelled by the customer.`
  );
}
