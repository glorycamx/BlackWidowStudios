import { Button } from "@/components/ui/Button";
import { Display, Reveal } from "@/components/home/Section";

/** The ending: put them to work. */
export function FinalCTA() {
  return (
    <section id="final" aria-label="Put your bots to work" className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-[24vh] pt-[20vh] text-center">
      <Display lines={["Put your bots", "to work tonight."]} className="text-[clamp(48px,8.4vw,148px)]" />
      <Reveal delay={0.15}>
        <p className="mx-auto mt-6 max-w-[520px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2">Set it once. They never stop. Or build your own bot in a sentence.</p>
      </Reveal>
      <Reveal delay={0.25}>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant="primary" size="lg" href="/live">
            Open the demo
          </Button>
          <Button variant="secondary" size="lg" href="/team?create=1">
            Build your own bot
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
