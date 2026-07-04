"use client";

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
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function Dashboard() {
  const [profile, setProfile] = useState<{ name: string } | null>(null);
  const [greeting, setGreeting] = useState("Welcome Back");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(doc(db, "users", user.uid));
          if (docSnap.exists()) {
            setProfile({ name: docSnap.data().name || "Farmer" });
          } else {
            setProfile({ name: user.displayName || "Farmer" });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });

    const hours = new Date().getHours();
    if (hours < 12) {
      setGreeting("Good Morning");
    } else if (hours < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold">
          {greeting}, {profile?.name || "Farmer"} 🌱
        </h1>
        <p className="text-gray-500">
          Welcome back to your AI Farming Assistant.
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
  );
}