import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function sendOrderNotification(
  recipientId: string,
  type: "Order Confirmed" | "Order Packed" | "Order Delivered" | "Order Cancelled" | "New Order Received",
  message: string
): Promise<void> {
  try {
    // 1. Log to console for debugging
    console.log(`[Notification Service] Sending to recipient: ${recipientId}. Type: ${type}. Message: ${message}`);

    // 2. Write order notification log to Firestore for future UI feeds
    await addDoc(collection(db, "notifications"), {
      recipientId,
      type,
      message,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to send order notification:", err);
  }
}
