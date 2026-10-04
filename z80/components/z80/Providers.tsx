"use client";

import { MotionConfig } from "motion/react";
import { CommandPalette } from "@/components/z80/CommandPalette";
import { WorkspaceProvider } from "@/components/z80/WorkspaceProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
      <WorkspaceProvider>
        {children}
        <CommandPalette />
      </WorkspaceProvider>
    </MotionConfig>
  );
}
