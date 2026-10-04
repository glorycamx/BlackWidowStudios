import { CommandCenterPreview } from "@/components/home/CommandCenterPreview";
import { ControlSection } from "@/components/home/ControlSection";
import { FinalCTA } from "@/components/home/FinalCTA";
import { FlowSection } from "@/components/home/FlowSection";
import { FragmentSection } from "@/components/home/FragmentSection";
import { Hero } from "@/components/home/Hero";
import { HomeScene } from "@/components/home/HomeScene";
import { IntegrationsSection } from "@/components/home/IntegrationsSection";
import { IntelligencesSection } from "@/components/home/IntelligencesSection";
import { LiveWorkSection } from "@/components/home/LiveWorkSection";
import { MemorySection } from "@/components/home/MemorySection";
import { TrustSection } from "@/components/home/TrustSection";
import { UseCasesSection } from "@/components/home/UseCasesSection";
import { Footer } from "@/components/z80/Footer";

export default function HomePage() {
  return (
    <>
      <main id="main" className="relative">
        <HomeScene />
        <Hero />
        <FragmentSection />
        <FlowSection />
        <IntelligencesSection />
        <LiveWorkSection />
        <ControlSection />
        <MemorySection />
        <IntegrationsSection />
        <UseCasesSection />
        <CommandCenterPreview />
        <TrustSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
