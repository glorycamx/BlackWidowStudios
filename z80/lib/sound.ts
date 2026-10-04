/**
 * Optional interface sound. OFF by default, never autoplays, and only runs
 * after a user gesture has unlocked the AudioContext. Tones are synthesized,
 * so there are no audio assets to load.
 */
import type { SoundName } from "@/lib/services/missionService";

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, gain = 0.04, type: OscillatorType = "sine") {
  const a = audio();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, a.currentTime + start);
  g.gain.setValueAtTime(0, a.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, a.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + start + dur);
  o.connect(g).connect(a.destination);
  o.start(a.currentTime + start);
  o.stop(a.currentTime + start + dur + 0.05);
}

const PATTERNS: Record<SoundName, () => void> = {
  deploy: () => {
    tone(220, 0, 0.5, 0.035);
    tone(330, 0.08, 0.5, 0.03);
    tone(660, 0.18, 0.7, 0.025);
  },
  complete: () => {
    tone(523, 0, 0.35, 0.03);
    tone(784, 0.1, 0.5, 0.03);
  },
  approval: () => {
    tone(659, 0, 0.18, 0.03, "triangle");
    tone(659, 0.22, 0.25, 0.025, "triangle");
  },
  message: () => tone(880, 0, 0.12, 0.015),
};

export function playSound(name: SoundName, enabled: boolean) {
  if (!enabled) return;
  try {
    PATTERNS[name]();
  } catch {
    /* audio unavailable — silently ignore */
  }
}
