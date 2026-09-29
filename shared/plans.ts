// The four Black Widow tiers, from the Operations Manual (Section 3.5).
// The revision-turnaround ladder is the spine of the tiers: every step up is faster.

export type Tier = 1 | 2 | 3 | 4;

export interface Plan {
  tier: Tier;
  name: string;
  setup: number;
  monthly: number;
  pages: string;
  revisionHours: number;
  revisionLabel: string;
  features: string[];
}

export const PLANS: Record<Tier, Plan> = {
  1: {
    tier: 1,
    name: "Starter",
    setup: 499,
    monthly: 49,
    pages: "1 page",
    revisionHours: 72,
    revisionLabel: "72-hour",
    features: ["Single-page website", "Hosting", "72-hour revisions"],
  },
  2: {
    tier: 2,
    name: "Get Found",
    setup: 997,
    monthly: 97,
    pages: "3 pages",
    revisionHours: 48,
    revisionLabel: "48-hour",
    features: [
      "Three-page website",
      "Google Business Profile set up",
      "Hosting and domain handled",
      "Every form submission sent to your phone",
      "48-hour revisions",
    ],
  },
  3: {
    tier: 3,
    name: "Get Booked",
    setup: 1497,
    monthly: 297,
    pages: "8 pages",
    revisionHours: 24,
    revisionLabel: "24-hour",
    features: [
      "Eight-page website",
      "Google Business Profile set up and managed (2 posts a week)",
      "Professional email at your domain",
      "Monthly newsletter",
      "Monthly review blast",
      "Monthly leads and traffic report",
      "24-hour revisions",
    ],
  },
  4: {
    tier: 4,
    name: "Own Your Market",
    setup: 2497,
    monthly: 597,
    pages: "Unlimited pages",
    revisionHours: 12,
    revisionLabel: "Same-day",
    features: [
      "Unlimited pages",
      "Meta and Google Ads managed for you",
      "Everything in Get Booked",
      "Full SEO management with rank reporting",
      "Priority support",
      "Same-day revisions",
    ],
  },
};

export function nextPlan(tier: Tier): Plan | null {
  return tier < 4 ? PLANS[(tier + 1) as Tier] : null;
}

// Referral offer from the Ops Manual, Section 6 (incentive still marked as an open decision there).
export const REFERRAL_CREDIT = 100;

// Add-ons a client can request on any tier. Priced by the team, so no price is shown.
export const ADDONS = [
  { id: "extra-page", title: "Add a page", pitch: "A new service or town page that ranks for what you do." },
  { id: "ads", title: "Run ads for me", pitch: "We build and manage Meta and Google ads that feed your site." },
  { id: "seo", title: "SEO push", pitch: "Keyword research, town pages and rank reporting." },
  { id: "reviews", title: "Review blast", pitch: "We text your past customers for Google reviews." },
] as const;

// Referral program. Amounts are a proposal; the Ops Manual (Section 6) still lists the incentive as open.
export const REFERRAL = {
  perSignup: REFERRAL_CREDIT, // off the referrer's next month, per business that signs
  cardSlots: 5, // punch card: every 5 signups fills a card
  cardBonus: 250, // extra credit for filling a card
  friendOffer: "$100 off your website build", // what the referred business gets
};

// Credit a referrer earns for their Nth signup (1-based): per-signup credit plus the card bonus on every full card
export function creditForSignup(n: number) {
  return REFERRAL.perSignup + (n % REFERRAL.cardSlots === 0 ? REFERRAL.cardBonus : 0);
}
