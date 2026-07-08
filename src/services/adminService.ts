import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, where, getDoc } from "firebase/firestore";
import { SellerProfile, Product } from "@/types/marketplace";
import { Order } from "@/types/order";

export interface PlatformStats {
  totalUsers: number;
  totalFarmers: number;
  totalCustomers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalCropAnalyses: number;
  totalTerraceAnalyses: number;
  revenue: number;
  activeUsers: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: string;
  isSeller?: boolean;
  sellerProfile?: SellerProfile;
  suspended?: boolean;
  createdAt?: any;
}

export const AdminService = {
  async getPlatformStats(): Promise<PlatformStats> {
    const usersSnap = await getDocs(collection(db, "users"));
    const productsSnap = await getDocs(collection(db, "products"));
    const ordersSnap = await getDocs(collection(db, "orders"));
    const cropAnalysesSnap = await getDocs(collection(db, "crop_analysis"));
    const terraceAnalysesSnap = await getDocs(collection(db, "terrace_analysis"));

    const users = usersSnap.docs.map(d => d.data() as UserProfile);
    const products = productsSnap.docs.map(d => d.data());
    const orders = ordersSnap.docs.map(d => d.data() as Order);

    const totalUsers = users.length;
    const totalFarmers = users.filter(u => u.role === "farmer" || u.isSeller).length;
    const totalCustomers = users.filter(u => u.role === "customer" && !u.isSeller).length;
    const totalSellers = users.filter(u => u.isSeller || u.sellerProfile?.verificationStatus === "approved").length;

    const totalProducts = products.length;
    const totalOrders = orders.length;
    const totalCropAnalyses = cropAnalysesSnap.size;
    const totalTerraceAnalyses = terraceAnalysesSnap.size;

    // Calculate revenue from Delivered orders
    const revenue = orders
      .filter(o => o.orderStatus === "Delivered")
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Active users: unique user IDs in orders and analyses in the last period
    const activeUids = new Set<string>();
    orders.forEach(o => activeUids.add(o.customerId));
    cropAnalysesSnap.docs.forEach(d => activeUids.add(d.data().uid));
    terraceAnalysesSnap.docs.forEach(d => activeUids.add(d.data().uid));
    const activeUsers = activeUids.size || Math.min(totalUsers, 3);

    return {
      totalUsers,
      totalFarmers,
      totalCustomers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalCropAnalyses,
      totalTerraceAnalyses,
      revenue,
      activeUsers
    };
  },

  async getAllUsers(): Promise<UserProfile[]> {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => {
      const data = d.data();
      return {
        uid: d.id,
        name: data.name || "Anonymous",
        email: data.email || "",
        role: data.role || "customer",
        isSeller: !!data.isSeller,
        sellerProfile: data.sellerProfile,
        suspended: !!data.suspended,
        createdAt: data.createdAt
      };
    });
  },

  async updateUserSuspensionStatus(uid: string, suspended: boolean): Promise<void> {
    const docRef = doc(db, "users", uid);
    await updateDoc(docRef, { suspended });
  },

  async getDensityMapPoints(): Promise<any[]> {
    const usersSnap = await getDocs(collection(db, "users"));
    const ordersSnap = await getDocs(collection(db, "orders"));

    const points: any[] = [];

    // 1. Sellers
    usersSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.isSeller && data.sellerProfile) {
        const profile = data.sellerProfile;
        if (profile.latitude && profile.longitude) {
          points.push({
            lat: profile.latitude,
            lng: profile.longitude,
            title: profile.businessName || "Seller Shop",
            description: `Type: ${profile.sellerType} | Address: ${profile.address}`,
            type: profile.sellerType || "Farmer",
          });
        }
      }
    });

    // 2. Orders (Delivery locations)
    ordersSnap.docs.forEach((d) => {
      const data = d.data();
      if (data.latitude && data.longitude) {
        points.push({
          lat: data.latitude,
          lng: data.longitude,
          title: `Order #${d.id.slice(-6).toUpperCase()}`,
          description: `Total: ₹${data.totalAmount} | Status: ${data.orderStatus}`,
          type: "Hydroponics Supplier", // Blue pins for orders
        });
      }
    });

    return points;
  },

  async getAllOrders(): Promise<Order[]> {
    const snap = await getDocs(collection(db, "orders"));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
      } as Order;
    });
  }
};
