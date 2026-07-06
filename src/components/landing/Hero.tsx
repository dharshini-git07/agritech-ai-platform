import HeroContent from "./HeroContent";
import HeroButton from "./HeroButton";
import HeroImage from "./HeroImage";
import HeroStats from "./HeroStats";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto py-12 lg:py-20 flex flex-col lg:flex-row items-center justify-between px-8 gap-10">
      <div>
        <HeroContent />
        <HeroButton />
        <HeroStats />
      </div>

      <HeroImage />
    </section>
  );
}