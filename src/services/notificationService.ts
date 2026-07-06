import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type NotificationType =
  | "Success"
  | "Info"
  | "Warning"
  | "Error"
  | "System"
  | "AI Recommendation"
  | "Marketplace"
  | "Weather";

export type NotificationPriority = "Low" | "Medium" | "High" | "Critical";

export interface NotificationData {
  id?: string;
  userId: string;
  role: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: any;
  actionUrl?: string;
}

export const NotificationService = {
  async createNotification(data: Omit<NotificationData, "createdAt" | "isRead">): Promise<string> {
    const docRef = await addDoc(collection(db, "notifications"), {
      ...data,
      isRead: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, "notifications", notificationId);
    await updateDoc(docRef, { isRead: true });
  },

  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("isRead", "==", false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const docRef = doc(db, "notifications", notificationId);
    await deleteDoc(docRef);
  },

  async clearAllNotifications(userId: string): Promise<void> {
    const q = query(collection(db, "notifications"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
};

// Backward-compatible export to maintain existing order checkout notification hooks
export async function sendOrderNotification(
  recipientId: string,
  type: string,
  message: string,
  actionUrl?: string
): Promise<void> {
  try {
    console.log(`[Notification Service Wrapper] Sending order update: ${type} to: ${recipientId}`);
    
    // Map order update notification to the new Firestore system
    let notifType: NotificationType = "Marketplace";
    let priority: NotificationPriority = "Medium";
    
    if (type.includes("Cancelled") || type.includes("Rejected")) {
      notifType = "Warning";
      priority = "High";
    }
 
    const isSellerPath = actionUrl?.includes("dashboard") || type === "New Order Received";
 
    await NotificationService.createNotification({
      userId: recipientId,
      role: isSellerPath ? "farmer" : "customer",
      title: type,
      message,
      type: notifType,
      priority,
      actionUrl: actionUrl || (isSellerPath ? "/dashboard/marketplace" : "/customer")
    });
  } catch (err) {
    console.error("Failed to send compatibility notification:", err);
  }
}
