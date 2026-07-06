import React, { useEffect, useState } from "react";
import { AdminService, PlatformStats } from "@/services/adminService";
import { useLanguage } from "@/components/common/LanguageContext";
import { 
  Users, 
  Store, 
  ShoppingBag, 
  Layers, 
  Activity, 
  DollarSign, 
  TrendingUp,
  LineChart,
  Home,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await AdminService.getPlatformStats();
        setStats(data);
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-150 h-28"></div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cardItems = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: <Users size={22} />,
      colorClass: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      title: "Total Farmers",
      value: stats.totalFarmers,
      icon: <TrendingUp size={22} />,
      colorClass: "bg-green-50 text-green-700 border-green-100",
    },
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      icon: <ShieldCheck size={22} />,
      colorClass: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
      title: "Marketplace Sellers",
      value: stats.totalSellers,
      icon: <Store size={22} />,
      colorClass: "bg-purple-50 text-purple-700 border-purple-100",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      icon: <Layers size={22} />,
      colorClass: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: <ShoppingBag size={22} />,
      colorClass: "bg-orange-50 text-orange-700 border-orange-100",
    },
    {
      title: "Crop Health Analyses",
      value: stats.totalCropAnalyses,
      icon: <LineChart size={22} />,
      colorClass: "bg-teal-50 text-teal-700 border-teal-100",
    },
    {
      title: "Terrace Layout Analyses",
      value: stats.totalTerraceAnalyses,
      icon: <Home size={22} />,
      colorClass: "bg-rose-50 text-rose-700 border-rose-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Highlight Metrics Row */}
      <div className="grid sm:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 p-6 rounded-3xl text-white shadow-md flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-[-20px] bottom-[-20px] opacity-15 rotate-12">
            <DollarSign size={140} />
          </div>
          <div className="space-y-1 relative z-10">
            <span className="text-xs text-green-100 font-bold uppercase tracking-wider block">Delivered Sales Revenue</span>
            <span className="text-3xl font-black block">₹{stats.revenue.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl relative z-10 shrink-0">
            <DollarSign size={24} />
          </div>
        </div>

        <div className="bg-white border border-gray-150 p-6 rounded-3xl shadow-sm flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Active Users (Session period)</span>
            <span className="text-3xl font-black text-gray-800 block">{stats.activeUsers}</span>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 shrink-0">
            <Activity size={24} className="animate-pulse" />
          </div>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {cardItems.map((item, idx) => (
          <div 
            key={idx} 
            className="bg-white border border-gray-150 p-5 rounded-3xl shadow-xs flex items-center gap-4 transition hover:shadow-md"
          >
            <div className={`p-3 rounded-2xl border shrink-0 ${item.colorClass}`}>
              {item.icon}
            </div>
            <div>
              <span className="text-xs text-gray-400 font-bold block">{item.title}</span>
              <span className="text-xl font-black text-gray-850 block mt-0.5">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
