"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Editorial section shell with a consistent index label. */
export function Section({ id, index, label, children, className, ariaLabel }: { id?: string; index?: string; label?: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <section id={id} aria-label={ariaLabel ?? label} className={cn("relative z-10 mx-auto w-full max-w-[1440px] px-5 md:px-10", className)}>
      {(index || label) && (
        <Reveal>
          <p className="label flex items-center gap-3">
            {index && <span className="text-fg-2">{index}</span>}
            <span className="h-px w-8 bg-white/15" />
            {label}
          </p>
        </Reveal>
      )}
      {children}
    </section>
  );
}

export function Reveal({ children, delay = 0, className, y = 18 }: { children: ReactNode; delay?: number; className?: string; y?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Enormous headline; each line reveals in sequence. */
export function Display({ lines, className, as = "h2" }: { lines: string[]; className?: string; as?: "h2" | "h3" }) {
  const Tag = as === "h3" ? motion.h3 : motion.h2;
  return (
    <Tag
      className={cn("display text-[clamp(44px,7.4vw,124px)]", className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ staggerChildren: 0.09 }}
    >
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className="block"
            variants={{ hidden: { y: "105%" }, show: { y: "0%", transition: { duration: 1.05, ease: EASE } } }}
          >
            {l}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
