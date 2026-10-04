/**
 * Pricing configuration.
 *
 * PLACEHOLDER: final prices and limits have not been set. Every number below
 * is `null` (rendered as "To be announced") until it is decided. Edit this
 * file only — components read from it and never hard-code plan details.
 */
export interface PricingTier {
  id: string;
  name: string;
  audience: string;
  /** Monthly price in USD, or null while undecided. */
  priceMonthly: number | null;
  priceNote: string;
  limits: { label: string; value: string | null }[];
  features: string[];
  cta: string;
  highlighted?: boolean;
}

export const pricing: { currency: string; note: string; tiers: PricingTier[] } = {
  currency: "USD",
  note: "Pricing is being finalized during early access.",
  tiers: [
    {
      id: "starter",
      name: "Starter",
      audience: "For individuals and small businesses.",
      priceMonthly: null,
      priceNote: "per month",
      limits: [
        { label: "Intelligences", value: "3" },
        { label: "Active missions", value: null },
        { label: "Seats", value: "1" },
      ],
      features: ["Command center", "Organization memory", "Approval gates", "Activity history"],
      cta: "Join early access",
    },
    {
      id: "growth",
      name: "Growth",
      audience: "For teams deploying multiple intelligences.",
      priceMonthly: null,
      priceNote: "per month",
      limits: [
        { label: "Intelligences", value: "All available" },
        { label: "Active missions", value: null },
        { label: "Seats", value: null },
      ],
      features: ["Everything in Starter", "Parallel missions", "Shared approvals", "Team permissions"],
      cta: "Join early access",
      highlighted: true,
    },
    {
      id: "scale",
      name: "Scale",
      audience: "For companies building AI operations.",
      priceMonthly: null,
      priceNote: "custom",
      limits: [
        { label: "Intelligences", value: "All + custom" },
        { label: "Active missions", value: "Custom" },
        { label: "Seats", value: "Custom" },
      ],
      features: ["Everything in Growth", "Custom intelligences", "Workspace isolation controls", "Dedicated onboarding"],
      cta: "Talk to us",
    },
  ],
};
