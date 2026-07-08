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
  ShieldCheck,
  Search,
  SlidersHorizontal,
  FileText
} from "lucide-react";
import { Order } from "@/types/order";
import { Input } from "@/components/ui/input";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [ordersList, setOrdersList] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatsAndPoints() {
      try {
        const data = await AdminService.getPlatformStats();
        setStats(data);
        const allOrders = await AdminService.getAllOrders();
        setOrdersList(allOrders);
      } catch (err) {
        console.error("Failed to load platform stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatsAndPoints();
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

  // Filter transaction orders
  const filteredOrders = ordersList.filter((ord) => {
    const matchesSearch = 
      ord.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ord.sellerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ord.paymentId && ord.paymentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = 
      statusFilter === "All" || 
      ord.paymentStatus?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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

      {/* Admin Payment Transaction Logs */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <FileText className="text-green-700" size={20} />
              <span>Payment Transaction Audit Logs</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Monitor customer payments, transaction states, order methods, and gateway signatures.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-450" size={14} />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders or payment ID..."
                className="pl-8.5 pr-3 py-1 bg-gray-50 border-gray-200 text-xs rounded-xl focus:border-green-400 w-52"
              />
            </div>
            
            <div className="flex items-center gap-1.5 bg-gray-50 border rounded-xl px-2 py-1 text-xs text-gray-600">
              <SlidersHorizontal size={12} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none font-bold text-gray-700 focus:outline-none cursor-pointer"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid Only</option>
                <option value="Pending">Pending Only</option>
                <option value="Failed">Failed Only</option>
                <option value="Cancelled">Cancelled Only</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">No transaction matches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-gray-400 uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Buyer Name</th>
                  <th className="py-2.5 px-3">Seller Store</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Reference ID</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3 px-3 font-bold text-gray-900">#{ord.id?.slice(-6).toUpperCase()}</td>
                    <td className="py-3 px-3">{ord.customerName}</td>
                    <td className="py-3 px-3 text-green-750">{ord.sellerName}</td>
                    <td className="py-3 px-3 capitalize">{ord.paymentMethod === "COD" ? "Cash" : "Razorpay"}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        ord.paymentStatus === "Paid" || ord.paymentStatus === "paid"
                          ? "bg-green-50 border-green-200 text-green-700"
                          : ord.paymentStatus === "Failed" || ord.paymentStatus === "failed"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}>
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-gray-400">{ord.paymentId || ord.razorpayOrderId || "N/A"}</td>
                    <td className="py-3 px-3 text-right font-bold text-gray-900">₹{ord.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Platform density map removed */}
    </div>
  );
}
