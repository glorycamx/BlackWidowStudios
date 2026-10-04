"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/components/z80/Wordmark";
import { publicNav } from "@/config/site";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background,box-shadow,backdrop-filter] duration-500 ease-[var(--ease-z)]",
          scrolled && !open ? "bg-black/55 shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl" : "bg-transparent",
        )}
      >
        <nav aria-label="Primary" className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 md:h-[72px] md:px-10">
          <Link href="/" aria-label="Z80.si home" className="text-[21px] md:text-[22px]">
            <Wordmark />
          </Link>
          <ul className="hidden items-center gap-9 md:flex">
            {publicNav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-[13px] text-fg-2 transition-colors duration-200 hover:text-white">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" href="/login">
              Sign in
            </Button>
            <Button variant="solid" size="sm" href="/signup">
              Deploy Z80
            </Button>
          </div>
          <button
            className="-mr-2 flex h-10 w-10 items-center justify-center text-fg-1 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-40 flex flex-col bg-black/95 px-6 pb-10 pt-24 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ul className="flex flex-col gap-1">
              {[...publicNav, { label: "Pricing", href: "/pricing" }, { label: "Sign in", href: "/login" }].map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05, duration: 0.6, ease: EASE }}
                >
                  <Link href={item.href} onClick={() => setOpen(false)} className="flex items-baseline justify-between border-b border-line py-4 text-[30px] font-medium tracking-[-0.03em] text-white">
                    {item.label}
                    <span className="font-mono text-[11px] text-fg-3">0{i + 1}</span>
                  </Link>
                </motion.li>
              ))}
            </ul>
            <motion.div className="mt-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
              <Button variant="primary" size="lg" href="/signup" className="w-full" magnetic={false} onClick={() => setOpen(false)}>
                Deploy Z80
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
