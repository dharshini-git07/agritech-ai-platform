import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardNavbar from "@/components/dashboard/DashboardNavbar";
import Sidebar from "@/components/dashboard/Sidebar";
import {
  Leaf,
  Droplets,
  Thermometer,
  Brain,
} from "lucide-react";

import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";

import WeatherCard from "@/components/dashboard/WeatherCard";
import RecentActivity from "@/components/dashboard/RecentActivity";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen flex bg-gray-50">

        <Sidebar />

        <div className="flex-1">

          <DashboardNavbar />

          <main className="p-8">

            <div className="space-y-8">

              <div>

                <h1 className="text-4xl font-bold">
                  Welcome Back 👋
                </h1>

                <p className="text-gray-500">
                  Manage your smart farming from one place.
                </p>

              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">

                <StatCard
                  title="Plants"
                  value="48"
                  icon={Leaf}
                />

                <StatCard
                  title="Water Tank"
                  value="82%"
                  icon={Droplets}
                />

                <StatCard
                  title="Temperature"
                  value="29°C"
                  icon={Thermometer}
                />

                <StatCard
                  title="AI Health"
                  value="94%"
                  icon={Brain}
                />

              </div>

              <QuickActions />
              <div className="grid lg:grid-cols-2 gap-6">

                <WeatherCard />

                <RecentActivity />

              </div>

            </div>

          </main>

        </div>

      </div>
    </ProtectedRoute>
  );
}