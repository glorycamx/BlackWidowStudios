"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

/**
 * Reduced-motion preference that is false on the server and on the first
 * client render, so server HTML and hydration always match. The real value
 * applies right after mount.
 */
export function useReducedMotionSafe(): boolean {
  const pref = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!pref;
}
