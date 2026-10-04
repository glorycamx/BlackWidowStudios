"use client";

import { useEffect } from "react";
import { workspace } from "@/lib/store/workspace";

/**
 * Hydrates the demo workspace from storage and drives the mission simulator
 * clock. Mounted once at the root so missions keep running across pages.
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
    return () => window.clearInterval(id);
  }, []);
  return <>{children}</>;
}
