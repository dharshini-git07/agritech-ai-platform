"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <header className="flex justify-between items-center bg-white shadow px-8 py-4">

      <h1 className="text-2xl font-bold">
        Farmer Dashboard
      </h1>

      <Button onClick={handleLogout}>
        Logout
      </Button>

    </header>
  );
}