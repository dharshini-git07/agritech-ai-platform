import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 border-b">
      <h1 className="text-2xl font-bold text-green-600">
        🌱 AgriTech AI
      </h1>

      <div className="hidden md:flex gap-8">
        <Link href="/">Home</Link>
        <Link href="/">Features</Link>
        <Link href="/">How It Works</Link>
        <Link href="/">Marketplace</Link>
        <Link href="/">About</Link>
      </div>

      <div className="flex gap-3">
        <Button variant="outline">
          Login
        </Button>

        <Button>
          Get Started
        </Button>
      </div>
    </nav>
  );
}