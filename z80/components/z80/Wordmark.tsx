import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  /** Animate the .si gradient. */
  animated?: boolean;
  as?: "span" | "h1" | "div";
}

/** Z80 in metallic white, .si in the electric spectrum. */
export function Wordmark({ className, animated = false, as: Tag = "span" }: Props) {
  return (
    <Tag className={cn("inline-flex items-baseline font-semibold tracking-[-0.04em]", className)} aria-label="Z80.si">
      <span className="metal" aria-hidden>
        Z80
      </span>
      <span className={cn("si-gradient", animated && "motion-safe:animate-[si-shift_7s_ease-in-out_infinite]")} aria-hidden>
        .si
      </span>
    </Tag>
  );
}
