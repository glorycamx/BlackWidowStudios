/** Editable site + SEO configuration. */
export const site = {
  name: "Z80.si",
  shortName: "Z80",
  title: "Z80 — Autonomous AI agents that run 24/7",
  titleTemplate: "%s — Z80",
  description:
    "Super intelligence is here. Autonomous AI agents that find opportunities, do the work and run your business around the clock.",
  tagline: "Super intelligence is here.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://z80.si",
  locale: "en_US",
  keywords: ["autonomous AI agents", "AI agents 24/7", "AI workforce", "superintelligence", "Z80"],
} as const;

export const publicNav = [
  { label: "Product", href: "/#fragment" },
  { label: "Intelligences", href: "/#intelligences" },
  { label: "Solutions", href: "/#solutions" },
  { label: "Company", href: "/company" },
] as const;

export const footerNav = [
  { label: "Product", href: "/#fragment" },
  { label: "Intelligences", href: "/#intelligences" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;
