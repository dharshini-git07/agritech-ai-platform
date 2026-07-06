import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Order } from "@/types/order";
import { Product } from "@/types/marketplace";

export interface AnalyticsData {
  userGrowth: { label: string; value: number }[];
  productCategories: { label: string; value: number }[];
  marketplaceSales: { label: string; value: number }[];
  cropAnalysisUsage: { label: string; value: number }[];
  terraceAnalysisUsage: { label: string; value: number }[];
  popularProducts: { label: string; value: number }[];
}

export const AnalyticsService = {
  async getAnalyticsData(): Promise<AnalyticsData> {
    const usersSnap = await getDocs(collection(db, "users"));
    const productsSnap = await getDocs(collection(db, "products"));
    const ordersSnap = await getDocs(collection(db, "orders"));
    const cropSnap = await getDocs(collection(db, "crop_analysis"));
    const terraceSnap = await getDocs(collection(db, "terrace_analysis"));

    // 1. User Growth
    const users = usersSnap.docs.map(d => d.data());
    const monthlyUsers: Record<string, number> = {};
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    // Default fallback months to ensure chart renders nicely even if new DB is empty
    const currentMonthIdx = new Date().getMonth();
    for (let i = 5; i >= 0; i--) {
      const idx = (currentMonthIdx - i + 12) % 12;
      monthlyUsers[months[idx]] = 0;
    }

    users.forEach(u => {
      let monthName = months[currentMonthIdx];
      if (u.createdAt?.seconds) {
        const date = new Date(u.createdAt.seconds * 1000);
        monthName = months[date.getMonth()];
      }
      if (monthlyUsers[monthName] !== undefined) {
        monthlyUsers[monthName]++;
      } else {
        monthlyUsers[monthName] = 1;
      }
    });

    const userGrowth = Object.entries(monthlyUsers).map(([label, value]) => ({ label, value }));

    // 2. Product Categories
    const products = productsSnap.docs.map(d => d.data() as Product);
    const categoryCounts: Record<string, number> = {};
    products.forEach(p => {
      const cat = p.category || "Other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    // Fallback categories if empty
    if (Object.keys(categoryCounts).length === 0) {
      categoryCounts["Seeds & Plants"] = 3;
      categoryCounts["Fresh Produce"] = 5;
      categoryCounts["Organic Inputs"] = 4;
      categoryCounts["Garden Tools"] = 2;
    }
    const productCategories = Object.entries(categoryCounts).map(([label, value]) => ({ label, value }));

    // 3. Marketplace Sales (delivered orders over the last 6 days or months)
    const orders = ordersSnap.docs.map(d => d.data() as Order);
    const dailySales: Record<string, number> = {};
    
    // Prefill last 6 days as placeholder labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailySales[label] = 0;
    }

    orders.forEach(o => {
      if (o.orderStatus === "Delivered") {
        let label = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (o.createdAt?.seconds) {
          label = new Date(o.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        if (dailySales[label] !== undefined) {
          dailySales[label] += o.totalAmount || 0;
        }
      }
    });
    const marketplaceSales = Object.entries(dailySales).map(([label, value]) => ({ label, value }));

    // 4. Crop Analysis Usage
    const cropAnalyses = cropSnap.docs.map(d => d.data());
    const cropCounts: Record<string, number> = {};
    cropAnalyses.forEach(c => {
      const crop = c.cropName || c.crop || "Unknown";
      cropCounts[crop] = (cropCounts[crop] || 0) + 1;
    });
    if (Object.keys(cropCounts).length === 0) {
      cropCounts["Tomato"] = 8;
      cropCounts["Chilli"] = 5;
      cropCounts["Brinjal"] = 3;
      cropCounts["Spinach"] = 2;
    }
    const cropAnalysisUsage = Object.entries(cropCounts).map(([label, value]) => ({ label, value }));

    // 5. Terrace Analysis Usage
    const terraceAnalyses = terraceSnap.docs.map(d => d.data());
    const sunlightCounts: Record<string, number> = {};
    terraceAnalyses.forEach(t => {
      const sun = t.sunlight || "Partial";
      sunlightCounts[sun] = (sunlightCounts[sun] || 0) + 1;
    });
    if (Object.keys(sunlightCounts).length === 0) {
      sunlightCounts["Full Sun"] = 6;
      sunlightCounts["Partial Shade"] = 8;
      sunlightCounts["Full Shade"] = 2;
    }
    const terraceAnalysisUsage = Object.entries(sunlightCounts).map(([label, value]) => ({ label, value }));

    // 6. Popular Products
    const productSales: Record<string, number> = {};
    orders.forEach(o => {
      if (o.products && Array.isArray(o.products)) {
        o.products.forEach(item => {
          const name = item.productName || "Product";
          productSales[name] = (productSales[name] || 0) + (item.quantity || 0);
        });
      }
    });
    if (Object.keys(productSales).length === 0) {
      productSales["Organic Fertilizer"] = 12;
      productSales["Spinach Seeds"] = 10;
      productSales["Grow Bags Medium"] = 8;
      productSales["Cocopeat Brick"] = 7;
    }
    const popularProducts = Object.entries(productSales)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      userGrowth,
      productCategories,
      marketplaceSales,
      cropAnalysisUsage,
      terraceAnalysisUsage,
      popularProducts
    };
  }
};
