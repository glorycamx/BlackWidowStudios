/** Editable site + SEO configuration. */
export const site = {
  name: "Z80.si",
  shortName: "Z80",
  title: "Z80: Your AI bots never clock out",
  titleTemplate: "%s · Z80",
  description:
    "Z80 bots find leads, post your content and watch your market around the clock, then text you when something needs a yes. Or build your own bot in a sentence.",
  tagline: "Super intelligence is here.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://z80.si",
  locale: "en_US",
  keywords: ["AI bots 24/7", "always-on AI", "AI lead finder", "AI content posting", "build your own AI bot", "Z80"],
} as const;

export const publicNav = [
  { label: "How it works", href: "/#how" },
  { label: "Your bots", href: "/#bots" },
  { label: "Last night", href: "/#night" },
  { label: "Company", href: "/company" },
] as const;

export const footerNav = [
  { label: "How it works", href: "/#how" },
  { label: "Your bots", href: "/#bots" },
  { label: "Demo", href: "/live" },
  { label: "Pricing", href: "/pricing" },
  { label: "Security", href: "/security" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
] as const;
