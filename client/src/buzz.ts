import { api, DEMO } from "./api";

// Vibration patterns (ms) that match the server's push patterns
export const PATTERNS: Record<string, number[]> = {
  lead: [120, 60, 120, 60, 400],
  revision_done: [120, 60, 120, 60, 400],
  upgrade_request: [120, 60, 120, 60, 400],
  referral: [120, 60, 120, 60, 400],
  site_live: [120, 60, 120, 60, 400],
  escalation: [400, 150, 400, 150, 400, 150, 800],
  default: [200, 100, 200],
};

let audioCtx: AudioContext | null = null;

// Unlock audio on the first tap (browsers block sound until the user interacts)
export function primeAudio() {
  const unlock = () => {
    try {
      audioCtx ||= new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtx.resume();
    } catch {}
    window.removeEventListener("pointerdown", unlock);
  };
  window.addEventListener("pointerdown", unlock);
}

function chime(kind: string) {
  if (!audioCtx || audioCtx.state !== "running") return;
  const notes = kind === "escalation" ? [880, 660, 880, 660] : kind === "lead" || kind === "revision_done" ? [660, 880, 1320] : [740, 988];
  const t0 = audioCtx.currentTime;
  notes.forEach((f, i) => {
    const osc = audioCtx!.createOscillator();
    const gain = audioCtx!.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const t = t0 + i * 0.11;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.connect(gain).connect(audioCtx!.destination);
    osc.start(t);
    osc.stop(t + 0.2);
  });
}

export function buzz(kind: string) {
  // Browsers only allow vibration after the person has tapped the page at least once
  const active = (navigator as any).userActivation?.hasBeenActive ?? true;
  try {
    if (active) navigator.vibrate?.(PATTERNS[kind] || PATTERNS.default);
  } catch {}
  chime(kind);
}

export type PushState = "unsupported" | "ios-install" | "denied" | "off" | "on";

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

export async function pushState(): Promise<PushState> {
  if (DEMO) return "off";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return isIOS() && !isStandalone() ? "ios-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? "on" : "off";
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function enablePush(): Promise<PushState> {
  if (DEMO) {
    buzz("lead");
    return "on";
  }
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const { key } = await api<{ key: string }>("GET", "/push/key");
  if (!key) throw new Error("Push isn't configured on the server yet (VAPID keys).");
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key) });
  await api("POST", "/push/subscribe", sub.toJSON());
  await api("POST", "/push/test");
  return "on";
}
