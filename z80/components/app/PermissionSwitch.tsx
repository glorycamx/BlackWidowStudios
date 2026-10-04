"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { permissionLevels } from "@/data/permissions";
import { cn } from "@/lib/utils";
import type { PermissionLevel } from "@/types";

const COLORS: Record<PermissionLevel, string> = {
  autonomous: "#6e9bff",
  approval: "#d77bff",
  disabled: "#686872",
};

const SHORT: Record<PermissionLevel, string> = {
  autonomous: "Auto",
  approval: "Ask first",
  disabled: "Blocked",
};

/** Three-state permission control (radio group). */
export function PermissionSwitch({ value, onChange, label }: { value: PermissionLevel; onChange(l: PermissionLevel): void; label: string }) {
  const id = useId();
  return (
    <div role="radiogroup" aria-label={`${label} permission`} className="relative flex shrink-0 rounded-[10px] bg-white/[0.03] p-[3px] hairline">
      {permissionLevels.map((l) => {
        const on = value === l.id;
        return (
          <button
            key={l.id}
            role="radio"
            aria-checked={on}
            onClick={() => onChange(l.id)}
            className={cn("relative z-10 h-7 rounded-[8px] px-3 text-[12px] transition-colors duration-200", on ? "text-white" : "text-fg-3 hover:text-fg-2")}
          >
            {on && (
              <motion.span
                layoutId={`perm-${id}`}
                className="absolute inset-0 -z-10 rounded-[8px]"
                style={{ background: `${COLORS[l.id]}1f`, boxShadow: `inset 0 0 0 1px ${COLORS[l.id]}66` }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            )}
            {SHORT[l.id]}
          </button>
        );
      })}
    </div>
  );
}
