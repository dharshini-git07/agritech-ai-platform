import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">

      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-10">

        <div>

          <h2 className="text-2xl font-bold text-white">
            🌱 AgriTech AI
          </h2>

          <p className="mt-4">
            AI Powered Smart Terrace Farming Platform.
          </p>

        </div>

        <div>

          <h3 className="text-white font-semibold mb-4">
            Quick Links
          </h3>

          <div className="space-y-2">

            <Link href="/">Home</Link><br/>
            <Link href="/">Features</Link><br/>
            <Link href="/">Marketplace</Link><br/>
            <Link href="/">Login</Link>

          </div>

        </div>

        <div>

          <h3 className="text-white font-semibold mb-4">
            Contact
          </h3>

          <p>Email: support@agritechai.com</p>
          <p>India</p>

        </div>

      </div>

      <div className="text-center mt-10 text-sm text-gray-500">
        © 2026 AgriTech AI. All Rights Reserved.
      </div>

    </footer>
  );
}