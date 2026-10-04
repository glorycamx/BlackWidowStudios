/**
 * Homepage flow state shared by the hero, the scroll director and the final
 * CTA. Module-level so sections stay decoupled.
 */
import type { AssemblyLayout } from "@/components/command/TeamAssembly";

export type HeroPhase = "idle" | "analyzing" | "assembly" | "deploying";

interface FlowState {
  phase: HeroPhase;
  layout: AssemblyLayout | null;
  activeGroups: [number, number, number];
}

let s: FlowState = { phase: "idle", layout: null, activeGroups: [1, 1, 1] };
const subs = new Set<() => void>();
const missionRequests = new Set<(text: string) => void>();

export const homeFlow = {
  get: () => s,
  set(patch: Partial<FlowState>) {
    s = { ...s, ...patch };
    subs.forEach((f) => f());
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  },
  /** Final CTA → hero: run a mission from anywhere on the page. */
  requestMission(text: string) {
    missionRequests.forEach((f) => f(text));
  },
  onMissionRequest(fn: (text: string) => void) {
    missionRequests.add(fn);
    return () => {
      missionRequests.delete(fn);
    };
  },
};
