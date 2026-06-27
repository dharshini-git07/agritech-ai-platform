import HeroContent from "./HeroContent";
import HeroButton from "./HeroButton";
import HeroImage from "./HeroImage";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto min-h-[85vh] flex items-center justify-between px-8">
      <div>
        <HeroContent />
        <HeroButton />
      </div>

      <HeroImage />
    </section>
  );
}