import { ChatbotVsSection } from "@/components/home/ChatbotVsSection";
import { ControlSection } from "@/components/home/ControlSection";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Hero } from "@/components/home/Hero";
import { HomeScene } from "@/components/home/HomeScene";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { IntegrationsSection } from "@/components/home/IntegrationsSection";
import { IntelligencesSection } from "@/components/home/IntelligencesSection";
import { MeetBotsSection } from "@/components/home/MeetBotsSection";
import { MemorySection } from "@/components/home/MemorySection";
import { OnTimeSection } from "@/components/home/OnTimeSection";
import { SignalsSection } from "@/components/home/SignalsSection";
import { WhileYouSleptSection } from "@/components/home/WhileYouSleptSection";
import { Footer } from "@/components/z80/Footer";

export default function HomePage() {
  return (
    <>
      <main id="main" className="relative">
        <HomeScene />
        <Hero />
        <ChatbotVsSection />
        <WhileYouSleptSection />
        <IntelligencesSection />
        <MeetBotsSection />
        <HowItWorksSection />
        <OnTimeSection />
        <SignalsSection />
        <ControlSection />
        <MemorySection />
        <IntegrationsSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
