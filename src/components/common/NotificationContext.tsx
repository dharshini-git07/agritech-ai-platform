"use client";
 
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { NotificationService, NotificationData } from "@/services/notificationService";
import { usePathname } from "next/navigation";

interface NotificationContextProps {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname() || "";
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  // Determine active view role based on URL path
  let activeRole = "customer";
  if (pathname.startsWith("/admin")) {
    activeRole = "admin";
  } else if (pathname.startsWith("/dashboard")) {
    activeRole = "farmer";
  }

  // Filter list and counts locally based on the active page role
  const roleNotifications = notifications.filter((n) => n.role === activeRole);
  const unreadCount = roleNotifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUid(user.uid);
      } else {
        setCurrentUid(null);
        setNotifications([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUid) return;

    setLoading(true);
    // Fetch notifications without orderBy to prevent Firestore index requirements
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUid)
    );

    const unsubscribeSnap = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<NotificationData, "id">),
      }));

      // Sort notifications locally in memory by createdAt descending
      list.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setNotifications(list);
      setLoading(false);
    }, (err) => {
      console.error("Firestore onSnapshot subscription failed:", err);
      setLoading(false);
    });

    return () => unsubscribeSnap();
  }, [currentUid]);

  const markAsRead = async (id: string) => {
    await NotificationService.markAsRead(id);
  };

  const markAllAsRead = async () => {
    if (!currentUid) return;
    // Batch update only notifications matching the activeRole for this user
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", currentUid),
      where("role", "==", activeRole),
      where("isRead", "==", false)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, { isRead: true });
    });
    await batch.commit();
  };

  const deleteNotification = async (id: string) => {
    await NotificationService.deleteNotification(id);
  };

  const clearAllNotifications = async () => {
    if (!currentUid) return;
    const q = query(
      collection(db, "notifications"), 
      where("userId", "==", currentUid),
      where("role", "==", activeRole)
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    snap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: roleNotifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
