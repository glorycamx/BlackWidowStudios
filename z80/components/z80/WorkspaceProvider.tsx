"use client";

import { useEffect } from "react";
import { workspace } from "@/lib/store/workspace";

/**
 * Hydrates the demo workspace from storage and drives the clock: jobs,
 * routines and heartbeats. Mounted once at the root so the bots keep
 * working across pages.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    workspace.init();
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(1000, now - last);
      last = now;
      workspace.tick(dt);
    }, 200);
    // Hidden tab: the clock pauses. Back again: the bots catch you up.
    const onVis = () => workspace.visibility(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return <>{children}</>;
}
