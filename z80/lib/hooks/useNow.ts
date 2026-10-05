"use client";

import { useEffect, useState } from "react";
import { now as simNow } from "@/lib/sim/clock";

/** Re-renders on an interval with the simulated current time (respects time travel). */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState(() => simNow());
  useEffect(() => {
    const id = setInterval(() => setNow(simNow()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
