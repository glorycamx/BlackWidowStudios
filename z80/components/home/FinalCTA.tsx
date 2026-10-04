"use client";

import { useState } from "react";
import { CommandConsole } from "@/components/command/CommandConsole";
import { Display, Reveal } from "@/components/home/Section";
import { homeFlow } from "@/lib/scene/homeFlow";

/** The ending returns to the beginning: give the agents a goal. */
export function FinalCTA() {
  const [value, setValue] = useState("");
  return (
    <section id="final" aria-label="Deploy your agents" className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center px-5 pb-[30vh] pt-[20vh] text-center">
      <Display lines={["Put your business", "on autopilot."]} className="text-[clamp(48px,8.4vw,148px)]" />
      <Reveal delay={0.15} className="mt-14 w-full max-w-[760px] text-left">
        <CommandConsole
          id="final-mission"
          size="final"
          value={value}
          onChange={setValue}
          onSubmit={(t) => {
            homeFlow.requestMission(t);
            setValue("");
          }}
        />
      </Reveal>
      <Reveal delay={0.25}>
        <p className="label mt-8">Set it once. It never stops.</p>
      </Reveal>
    </section>
  );
}
