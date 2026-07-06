import React, { useState } from "react";
import { useLanguage } from "@/components/common/LanguageContext";
import { ReportService } from "@/services/reportService";
import { AdminService } from "@/services/adminService";
import { getProducts } from "@/services/marketplaceService";
import { getAllOrders } from "@/services/orderService";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Download, FileSpreadsheet, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ReportType = "users" | "products" | "orders" | "crop_analysis" | "terrace_analysis";
type ReportFormat = "csv" | "excel" | "pdf";

export default function ReportsTab() {
  const { t } = useLanguage();
  const [reportType, setReportType] = useState<ReportType>("users");
  const [reportFormat, setReportFormat] = useState<ReportFormat>("csv");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      let headers: string[] = [];
      let rows: any[][] = [];
      let reportTitle = "";

      if (reportType === "users") {
        reportTitle = "Platform Users Registry Report";
        headers = ["UID", "Name", "Email Address", "Role", "Is Seller", "Suspended"];
        const data = await AdminService.getAllUsers();
        rows = data.map(u => [
          u.uid,
          u.name,
          u.email,
          u.role,
          u.isSeller ? "Yes" : "No",
          u.suspended ? "Yes" : "No"
        ]);
      } else if (reportType === "products") {
        reportTitle = "Marketplace Products Catalog Report";
        headers = ["Product ID", "Name", "Category", "Subcategory", "Price (INR)", "Stock Quantity", "Approval", "Availability", "Organic"];
        const data = await getProducts(); // Retrieve all products
        rows = data.map(p => [
          p.id || "",
          p.productName,
          p.category,
          p.subcategory,
          p.price.toFixed(2),
          p.quantity,
          p.approvalStatus || "pending",
          p.availability,
          p.organicCertified ? "Yes" : "No"
        ]);
      } else if (reportType === "orders") {
        reportTitle = "Marketplace Orders & Fulfilments Report";
        headers = ["Order ID", "Customer ID", "Seller ID", "Total Amount (INR)", "Payment Method", "Fulfillment Status"];
        const data = await getAllOrders();
        rows = data.map(o => [
          o.id || "",
          o.customerId,
          o.sellerId,
          (o.totalAmount || 0).toFixed(2),
          o.paymentMethod,
          o.orderStatus
        ]);
      } else if (reportType === "crop_analysis") {
        reportTitle = "AI Crop Health Analyses Registry";
        headers = ["Analysis ID", "User ID", "Crop Name", "Overall Health", "Diagnosed Disease", "Severity", "Water Recommendation", "Fertilizer Recommendation"];
        const snap = await getDocs(collection(db, "crop_analysis"));
        rows = snap.docs.map(doc => {
          const d = doc.data();
          return [
            doc.id,
            d.uid || "",
            d.cropName || d.crop || "N/A",
            d.healthStatus || d.health || "N/A",
            d.diseaseName || d.disease || "Healthy",
            d.severity || "None",
            d.waterRecommendation || "N/A",
            d.fertilizerRecommendation || "N/A"
          ];
        });
      } else if (reportType === "terrace_analysis") {
        reportTitle = "AI Terrace Layout Analyses Registry";
        headers = ["Analysis ID", "User ID", "Terrace Area (sq ft)", "Usable Area (sq ft)", "Sunlight", "Drainage Status", "Grow Bag Counts", "Hydroponics Suitable"];
        const snap = await getDocs(collection(db, "terrace_analysis"));
        rows = snap.docs.map(doc => {
          const d = doc.data();
          return [
            doc.id,
            d.uid || "",
            d.terraceArea || "N/A",
            d.usableArea || "N/A",
            d.sunlight || "N/A",
            d.drainage || "N/A",
            d.growBagCount || "N/A",
            d.hydroponicsSuitability || "N/A"
          ];
        });
      }

      const filePrefix = `agritech_report_${reportType}_${new Date().toISOString().slice(0, 10)}`;

      if (reportFormat === "csv") {
        ReportService.exportToCSV(headers, rows, filePrefix);
      } else if (reportFormat === "excel") {
        ReportService.exportToExcel(headers, rows, filePrefix);
      } else if (reportFormat === "pdf") {
        ReportService.exportToPDF(reportTitle, headers, rows, filePrefix);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      alert("Failed to export report: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-150 rounded-3xl p-10 shadow-sm space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          📊 Platform Intelligence Reports
        </h3>
        <p className="text-xs text-gray-400 mt-1">
          Export registered datasets, sales histories, and AI analysis records directly.
        </p>
      </div>

      <div className="space-y-4">
        {/* Report Category Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Select Report Source</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full bg-gray-50 border border-gray-150 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer font-medium"
          >
            <option value="users">👤 Users Accounts & Profiles</option>
            <option value="products">📦 Marketplace Listings Catalog</option>
            <option value="orders">🛒 Marketplace Orders & Shipments</option>
            <option value="crop_analysis">🌿 AI Crop Health Analysis logs</option>
            <option value="terrace_analysis">🏠 AI Terrace Layout Analysis logs</option>
          </select>
        </div>

        {/* Report Format Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Select Export Format</label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: "csv", label: "CSV File", icon: <FileText size={18} /> },
              { id: "excel", label: "Excel Sheet", icon: <FileSpreadsheet size={18} /> },
              { id: "pdf", label: "PDF Document", icon: <Download size={18} /> }
            ].map((fmt) => (
              <label 
                key={fmt.id}
                className={`flex flex-col items-center justify-center p-4 border rounded-2xl cursor-pointer select-none transition ${
                  reportFormat === fmt.id
                    ? "border-green-500 bg-green-50/50 text-green-700 font-bold"
                    : "border-gray-150 hover:bg-gray-50 text-gray-500"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  checked={reportFormat === fmt.id}
                  onChange={() => setReportFormat(fmt.id as ReportFormat)}
                  className="hidden"
                />
                {fmt.icon}
                <span className="text-xs mt-1.5">{fmt.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t flex flex-col items-center gap-3">
        <Button
          onClick={handleDownload}
          disabled={loading}
          className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs"
        >
          <Download size={18} />
          <span>{loading ? "Exporting File..." : "Generate & Download"}</span>
        </Button>

        {success && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold animate-bounce mt-1">
            <CheckCircle2 size={14} />
            <span>Success: Report downloaded successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
}
