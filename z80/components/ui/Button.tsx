"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useMagnetic } from "@/lib/hooks/useMagnetic";
import { cn } from "@/lib/utils";

type Variant = "primary" | "solid" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-medium uppercase tracking-[0.12em] transition-[background,color,box-shadow,opacity] duration-200 ease-[var(--ease-z)] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "energy-border bg-[#0a0a10] text-white shadow-[0_0_0_0_rgba(100,91,255,0)] hover:bg-[#0e0e17] hover:shadow-[0_0_40px_-6px_rgba(100,91,255,0.55)]",
  solid: "bg-white text-black hover:bg-[#e9e9ee] shadow-[0_0_30px_-10px_rgba(255,255,255,0.6)]",
  secondary: "text-fg-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)] hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] hover:bg-white/[0.03]",
  ghost: "text-fg-2 hover:text-white",
  danger: "text-[#ff8ca0] shadow-[inset_0_0_0_1px_rgba(255,92,122,0.35)] hover:bg-[rgba(255,92,122,0.08)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 rounded-[9px] px-3.5 text-[10.5px]",
  md: "h-10 rounded-[11px] px-5 text-[11px]",
  lg: "h-13 rounded-[13px] px-7 text-[12px] tracking-[0.16em]",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  magnetic?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type ButtonProps = CommonProps & Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & { href?: undefined };
type LinkProps = CommonProps & { href: string; prefetch?: boolean; onClick?: () => void; "aria-label"?: string; target?: string };

export const Button = forwardRef<HTMLButtonElement, ButtonProps | LinkProps>(function Button(props, fwd) {
  const { variant = "secondary", size = "md", magnetic, icon, iconRight, className, children } = props;
  const isMagnetic = magnetic ?? (variant === "primary" || variant === "solid");
  const mag = useMagnetic<HTMLSpanElement>(isMagnetic ? 4 : 0);
  const cls = cn(base, variants[variant], sizes[size], className);
  const inner = (
    <>
      {icon}
      {children && <span className="relative">{children}</span>}
      {iconRight}
    </>
  );

  let el: ReactNode;
  if ("href" in props && props.href !== undefined) {
    const { href, prefetch, onClick, target } = props as LinkProps;
    el = (
      <Link href={href} prefetch={prefetch} onClick={onClick} target={target} aria-label={props["aria-label"]} className={cls}>
        {inner}
      </Link>
    );
  } else {
    const { variant: _v, size: _s, magnetic: _m, icon: _i, iconRight: _ir, className: _c, children: _ch, type, ...rest } = props as ButtonProps;
    void _v; void _s; void _m; void _i; void _ir; void _c; void _ch;
    el = (
      <button ref={fwd} type={type ?? "button"} className={cls} {...rest}>
        {inner}
      </button>
    );
  }

  if (!isMagnetic) return el;
  return (
    <motion.span ref={mag.ref} style={mag.style} className="inline-flex">
      {el}
    </motion.span>
  );
});
