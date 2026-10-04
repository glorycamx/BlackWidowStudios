"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** True after hydration — for client-only values (time, storage). */
export function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}
