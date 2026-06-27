import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import AISection from "@/components/landing/AISection";
import FarmingSection from "@/components/landing/FarmingSection";
import Marketplace from "@/components/landing/Marketplace";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <AISection />
      <FarmingSection />
      <Marketplace />
      <Footer />
    </>
  );
}