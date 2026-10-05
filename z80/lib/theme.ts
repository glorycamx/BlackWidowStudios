"use client";

/**
 * App theme: light, dark, or follow the device. Stored per browser. The
 * marketing site is always dark; only the app reads this.
 */
import { useEffect, useState } from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "z80.theme";
const listeners = new Set<() => void>();

export function getThemePref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* storage unavailable */
  }
  return "system";
}

export function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref !== "system") return pref;
  if (typeof window === "undefined" || !window.matchMedia) return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

/** Apply the theme to <html>. */
export function applyTheme(pref: ThemePref = getThemePref()) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveTheme(pref);
}

export function clearTheme() {
  if (typeof document === "undefined") return;
  delete document.documentElement.dataset.theme;
}

export function setThemePref(pref: ThemePref) {
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* ignore */
  }
  applyTheme(pref);
  listeners.forEach((l) => l());
}

/** The current preference, live. Applies the theme while mounted and follows device changes. */
export function useThemePref(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>("system");
  useEffect(() => {
    const sync = () => setPref(getThemePref());
    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);
  return [pref, setThemePref];
}

/** Mount once in the app shell: applies the theme, follows the device, and clears it on leaving the app. */
export function useAppTheme() {
  useEffect(() => {
    applyTheme();
    const mq = window.matchMedia?.("(prefers-color-scheme: light)");
    const onChange = () => getThemePref() === "system" && applyTheme("system");
    mq?.addEventListener?.("change", onChange);
    return () => {
      mq?.removeEventListener?.("change", onChange);
      clearTheme();
    };
  }, []);
}
