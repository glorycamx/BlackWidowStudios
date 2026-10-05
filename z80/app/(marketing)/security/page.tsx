import type { Metadata } from "next";
import { Editorial, Prose } from "@/components/z80/Editorial";

export const metadata: Metadata = { title: "Security", description: "How Z80 keeps you in charge of bots that work around the clock." };

export default function SecurityPage() {
  return (
    <Editorial label="Security" title="They do the work. You stay the boss." intro={<p>Giving software access to your business is a big decision. Control is built into Z80, not added on top.</p>}>
      <Prose>
        <h2>Clear permissions</h2>
        <p>Every action a bot can take follows a workspace rule with one of three levels: <strong>do it</strong>, <strong>ask first</strong>, or <strong>blocked</strong>. The defaults are careful. Anything that leaves your company asks first, and anything destructive is blocked.</p>
        <h2>Your yes, first</h2>
        <p>When a job or routine reaches something that needs approval, it stops and waits. You see exactly what will happen before it happens, and you can approve, hold, or say no. A routine only acts on its own if you turn on &ldquo;Do it without asking&rdquo; for it.</p>
        <h2>Every step on record</h2>
        <p>Every check and every action is logged: which bot did it, what it did, and when. Activity is the full history.</p>
        <h2>Stop anything, anytime</h2>
        <p>Pause a routine, pause a bot, or disconnect an app whenever you want. Work that depends on it waits until you decide what happens next.</p>
        <h2>Your workspace is yours</h2>
        <p>Memory, apps, routines and jobs belong to one workspace and are never shared between companies.</p>
        <h2>Where we are</h2>
        <p>Z80 is in early access. This site does not claim third-party security certifications. If your company needs specific assurances, talk to us before connecting real systems.</p>
      </Prose>
    </Editorial>
  );
}
