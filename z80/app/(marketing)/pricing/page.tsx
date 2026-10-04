import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Editorial } from "@/components/z80/Editorial";
import { pricing } from "@/config/pricing";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Pricing", description: "Plans for individuals, teams, and companies building AI operations." };

function price(v: number | null, note: string) {
  if (v === null) return { main: "To be announced", note: "" };
  return { main: `$${v}`, note };
}

export default function PricingPage() {
  return (
    <Editorial label="Pricing" title="Pay for the workforce, not the tools." intro={<p>{pricing.note}</p>}>
      <div className="grid gap-4 lg:grid-cols-3">
        {pricing.tiers.map((t) => {
          const p = price(t.priceMonthly, t.priceNote);
          return (
            <section key={t.id} aria-label={t.name} className={cn("panel flex flex-col p-7", t.highlighted && "energy-border")}>
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-white">{t.name}</h2>
                {t.highlighted && <span className="label text-fg-1">Recommended</span>}
              </div>
              <p className="mt-3 text-[14.5px] text-fg-2">{t.audience}</p>
              <div className="mt-8">
                <span className="text-[28px] font-semibold tracking-[-0.03em] text-white">{p.main}</span>
                {p.note && <span className="ml-2 text-[13px] text-fg-3">{p.note}</span>}
              </div>
              <dl className="mt-8 space-y-2.5 border-t border-line pt-6 text-[13.5px]">
                {t.limits.map((l) => (
                  <div key={l.label} className="flex justify-between">
                    <dt className="text-fg-3">{l.label}</dt>
                    <dd className="text-fg-1">{l.value ?? "TBA"}</dd>
                  </div>
                ))}
              </dl>
              <ul className="mt-6 flex-1 space-y-2.5">
                {t.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-[14px] text-fg-1">
                    <Check size={13} className="text-fg-3" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button variant={t.highlighted ? "solid" : "secondary"} href="/signup" className="w-full" magnetic={false}>
                  {t.cta}
                </Button>
              </div>
            </section>
          );
        })}
      </div>
    </Editorial>
  );
}
