import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <DashboardNavbar />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
