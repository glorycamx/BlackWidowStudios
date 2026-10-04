import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] px-1 font-mono text-[10px] text-fg-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]">
      {children}
    </kbd>
  );
}
