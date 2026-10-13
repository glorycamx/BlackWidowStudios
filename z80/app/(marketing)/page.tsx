import { AgentsSection } from "@/components/home/AgentsSection";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { HomeScene } from "@/components/home/HomeScene";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TrustSection } from "@/components/home/TrustSection";
import { Footer } from "@/components/z80/Footer";

export default function HomePage() {
  return (
    <>
      <main id="main" className="relative">
        <HomeScene />
        <Hero />
        <HowItWorksSection />
        <AgentsSection />
        <TrustSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
