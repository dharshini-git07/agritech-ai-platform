"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function MarketplaceGateway() {
  const router = useRouter();
  const [statusText, setStatusText] = useState("Authenticating and checking your role...");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          setStatusText("Loading your profile details...");
          const docSnap = await getDoc(doc(db, "users", user.uid));
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            const role = userData.role || "customer";
            
            setStatusText(`Redirecting based on role (${role})...`);
            
            if (role === "farmer") {
              router.push("/dashboard/marketplace");
            } else if (role === "admin") {
              router.push("/admin");
            } else {
              router.push("/customer");
            }
          } else {
            // Profile not found, default to customer
            router.push("/customer");
          }
        } catch (err) {
          console.error("Error routing user in marketplace gateway:", err);
          setStatusText("Failed to retrieve user role. Redirecting to home...");
          setTimeout(() => router.push("/"), 2000);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <ProtectedRoute>
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 text-gray-500 font-semibold gap-3">
        <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="animate-pulse">{statusText}</p>
      </div>
    </ProtectedRoute>
  );
}
