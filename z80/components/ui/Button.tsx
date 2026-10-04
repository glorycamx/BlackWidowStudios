"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { useMagnetic } from "@/lib/hooks/useMagnetic";
import { cn } from "@/lib/utils";

type Variant = "primary" | "solid" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[-0.01em] transition-[background,color,box-shadow,opacity,transform] duration-200 ease-[var(--ease-z)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary:
    "energy-border bg-[#0d0d14] text-white hover:bg-[#13131d] hover:shadow-[0_0_44px_-8px_rgba(100,91,255,0.6)]",
  solid: "bg-white text-black hover:bg-[#e8e8ed]",
  secondary: "bg-white/[0.08] text-white hover:bg-white/[0.13]",
  ghost: "text-[#9aa5ff] hover:text-white",
  danger: "text-[#ff8ca0] bg-[rgba(255,92,122,0.1)] hover:bg-[rgba(255,92,122,0.16)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-4 text-[13px]",
  md: "h-10 px-5 text-[14px]",
  lg: "h-12 px-7 text-[15px]",
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
