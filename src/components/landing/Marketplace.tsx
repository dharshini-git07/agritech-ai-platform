import { Button } from "@/components/ui/button";
import { ShoppingBasket } from "lucide-react";

export default function Marketplace() {
  return (
    <section className="bg-green-600 text-white py-24">

      <div className="max-w-6xl mx-auto text-center px-8">

        <ShoppingBasket
          size={60}
          className="mx-auto mb-6"
        />

        <h2 className="text-5xl font-bold">
          Namma Kadai Marketplace
        </h2>

        <p className="mt-6 text-lg opacity-90 max-w-2xl mx-auto">
          Farmers can sell fresh vegetables directly to customers
          without intermediaries through our digital marketplace.
        </p>

        <Button
          className="mt-10 bg-white text-green-700 hover:bg-gray-100"
        >
          Explore Marketplace
        </Button>

      </div>

    </section>
  );
}