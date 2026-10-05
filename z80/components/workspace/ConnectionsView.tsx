"use client";

import { Bell, BellOff, Check } from "lucide-react";
import { EmptyState, PageHeader, PageWrap } from "@/components/app/primitives";
import { integrations, integrationStatusLabel } from "@/data/integrations";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { cn } from "@/lib/utils";

const CATEGORY: Record<string, string> = {
  communication: "Communication",
  productivity: "Productivity",
  crm: "CRM",
  commerce: "Commerce",
  social: "Social",
  web: "Web",
};

/**
 * Connections. Only integrations marked live/preview can be connected; the
 * rest are honestly labelled and users can ask to be notified.
 */
export function ConnectionsView() {
  const connections = useWorkspace((s) => s.connections);
  const interest = useWorkspace((s) => s.interest);
  const connected = integrations.filter((i) => connections[i.id]);
  const cats = [...new Set(integrations.map((i) => i.category))];

  return (
    <PageWrap>
      <PageHeader
        label={`${connected.length} connected`}
        title="Connections"
        sub="The apps your bots can use, and how they reach you."
      />
      {connected.length === 0 && (
        <div className="mt-6 panel">
          <EmptyState title="Your bots need apps." body="Connect the software your business already uses." />
        </div>
      )}
      <div className="mt-12 space-y-12">
        {cats.map((c) => (
          <section key={c} aria-label={CATEGORY[c]}>
            <h2 className="label">{CATEGORY[c]}</h2>
            <ul className="mt-4 border-t border-line">
              {integrations
                .filter((i) => i.category === c)
                .map((i) => {
                  const on = !!connections[i.id];
                  const connectable = i.status === "live" || i.status === "preview";
                  const watching = interest.includes(i.id);
                  return (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-line py-4">
                      <div className="flex items-center gap-4">
                        <span className={cn("flex h-10 w-10 items-center justify-center rounded-[11px] text-[13px] tabular-nums", on ? "bg-white text-black" : "text-fg-1 hairline")}>{i.mono}</span>
                        <div>
                          <div className="text-[15px] text-white">{i.name}</div>
                          <div className="text-[13px] text-fg-3">{i.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn("text-[12px]", on ? "text-white" : i.status === "preview" ? "text-run" : "text-fg-3")}>
                          {on ? "Connected" : integrationStatusLabel[i.status]}
                        </span>
                        {connectable ? (
                          <button
                            onClick={() => workspace.toggleConnection(i.id)}
                            className={cn("flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] transition-colors", on ? "text-fg-2 hairline hover:text-white" : "bg-white text-black hover:bg-[#e9e9ee]")}
                          >
                            {on ? "Disconnect" : (<><Check size={12} /> Connect</>)}
                          </button>
                        ) : (
                          <button
                            onClick={() => workspace.toggleInterest(i.id)}
                            aria-pressed={watching}
                            className="flex h-8 items-center gap-1.5 rounded-[9px] px-3 text-[12px] text-fg-2 hairline hover:text-white"
                          >
                            {watching ? <BellOff size={12} /> : <Bell size={12} />}
                            {watching ? "Watching" : "Notify me"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-10 text-[12.5px] text-fg-3">In this demo build, connecting Public Web is simulated and contacts no third-party service.</p>
    </PageWrap>
  );
}
