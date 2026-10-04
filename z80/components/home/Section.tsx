"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** Section shell. Numbered markers are gone: the headline carries the section. */
export function Section({ id, children, className, ariaLabel, label }: { id?: string; index?: string; label?: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <section id={id} aria-label={ariaLabel ?? label} className={cn("relative z-10 mx-auto w-full max-w-[1240px] px-5 md:px-10", className)}>
      {children}
    </section>
  );
}

/** Apple-style centered intro: one headline, one line. */
export function Intro({ title, sub, className }: { title: string[]; sub?: string; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-[880px] text-center", className)}>
      <Display lines={title} className="text-[clamp(44px,6.4vw,96px)]" />
      {sub && (
        <Reveal delay={0.1}>
          <p className="mx-auto mt-6 max-w-[560px] text-[clamp(18px,1.6vw,22px)] leading-[1.4] text-fg-2">{sub}</p>
        </Reveal>
      )}
    </div>
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
      className={cn("display text-[clamp(44px,7.4vw,124px)] text-balance", className)}
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
