import { cn } from "@/lib/utils";

interface Props {
  color?: string;
  /** Breathing animation for live states. */
  live?: boolean;
  size?: number;
  className?: string;
}

/** The breathing status dot used for every live entity. */
export function StatusDot({ color = "var(--color-run)", live = true, size = 6, className }: Props) {
  return (
    <span className={cn("relative inline-flex shrink-0", className)} style={{ width: size, height: size }} aria-hidden>
      {live && (
        <span
          className="absolute inset-[-3px] rounded-full opacity-40 blur-[3px] motion-safe:animate-breathe"
          style={{ background: color }}
        />
      )}
      <span className={cn("relative rounded-full", live && "motion-safe:animate-breathe")} style={{ width: size, height: size, background: color, boxShadow: `0 0 ${size * 1.5}px ${color}` }} />
    </span>
  );
}
