"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useThemePref, type ThemePref } from "@/lib/theme";
import { cn } from "@/lib/utils";

const OPTIONS: { id: ThemePref; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: Monitor },
];

/** Light, dark, or match the device. */
export function ThemeSwitch({ className, size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const [pref, setPref] = useThemePref();
  const big = size === "lg";
  return (
    <div role="radiogroup" aria-label="Appearance" className={cn("flex rounded-[11px] bg-white/[0.04] p-[3px] hairline", className)}>
      {OPTIONS.map((o) => {
        const on = pref === o.id;
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={on}
            onClick={() => setPref(o.id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-[8px] transition-colors",
              big ? "h-11 text-[14px]" : "h-7 text-[12px]",
              on ? "bg-[var(--surface-raised)] text-white shadow-[0_1px_2px_rgb(0_0_0/0.12)]" : "text-fg-3 hover:text-fg-1",
            )}
          >
            <o.icon size={big ? 15 : 12} />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
