import { HomeComposer } from "@/components/home/HomeComposer";
import { Reveal } from "@/components/home/Section";

/** The ending: the same box as the top of the page. */
export function FinalCTA() {
  return (
    <section id="final" aria-label="Deploy your first agent" className="relative z-10 px-5 pb-32 pt-24 md:pb-40">
      <div className="mx-auto max-w-[680px] text-center">
        <Reveal>
          <h2 className="text-[clamp(32px,4vw,52px)] font-semibold leading-[1.08] tracking-[-0.03em] text-white">Deploy your first agent tonight.</h2>
          <p className="mt-3 text-[17px] text-fg-2">Type what you need. It starts working in seconds.</p>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 text-left">
          <HomeComposer id="final-composer" starters={false} />
        </Reveal>
      </div>
    </section>
  );
}
