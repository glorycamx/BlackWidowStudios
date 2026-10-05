"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader, PageWrap } from "@/components/app/primitives";
import { availableAgents } from "@/data/bots";
import { memoryDomains } from "@/data/memory";
import { useWorkspace, workspace } from "@/lib/store/workspace";

/** Organization memory — the context every intelligence shares. */
export function MemoryView() {
  const memory = useWorkspace((s) => s.memory);
  const org = useWorkspace((s) => s.org);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <PageWrap>
      <PageHeader
        label="Memory"
        title={org?.name ?? "Your company"}
        sub="What your bots know about your business."
      />
      {org?.description && <p className="mt-6 max-w-[560px] text-[15px] text-fg-1">{org.description}</p>}
      <div className="mt-12 grid gap-px overflow-hidden rounded-[16px] bg-line md:grid-cols-2 xl:grid-cols-3">
        {memoryDomains.map((d) => {
          const items = memory[d.id] ?? [];
          const users = availableAgents.filter((a) => a.memory.includes(d.id));
          return (
            <section key={d.id} className="bg-black p-6" aria-label={d.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-white">{d.label}</h2>
                  <p className="mt-1.5 text-[13px] text-fg-3">{d.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {availableAgents
                      .filter((a) => a.memory.includes(d.id))
                      .map((a) => (
                        <span key={a.id} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px]" style={{ color: a.accent.tint }}>
                          {a.name}
                        </span>
                      ))}
                  </div>
                </div>
                <div className="flex gap-1.5 pt-1" aria-label={`Used by ${users.map((u) => u.name).join(", ")}`}>
                  {users.map((u) => (
                    <span key={u.id} title={u.name} className="h-1.5 w-1.5 rounded-full" style={{ background: u.accent.hex, boxShadow: `0 0 8px ${u.accent.hex}` }} />
                  ))}
                </div>
              </div>
              <ul className="mt-5 space-y-1.5">
                {items.map((it, i) => (
                  <li key={`${it}-${i}`} className="group flex items-center justify-between gap-3 rounded-[8px] px-2.5 py-1.5 text-[14px] text-fg-1 hover:bg-white/[0.03]">
                    {it}
                    <button aria-label={`Remove ${it}`} onClick={() => workspace.removeMemory(d.id, i)} className="text-fg-4 opacity-0 transition-opacity hover:text-white focus:opacity-100 group-hover:opacity-100">
                      <X size={13} />
                    </button>
                  </li>
                ))}
              </ul>
              <form
                className="mt-3 flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  workspace.addMemory(d.id, drafts[d.id] ?? "");
                  setDrafts((x) => ({ ...x, [d.id]: "" }));
                }}
              >
                <label className="sr-only" htmlFor={`mem-${d.id}`}>
                  Add to {d.label}
                </label>
                <input
                  id={`mem-${d.id}`}
                  value={drafts[d.id] ?? ""}
                  onChange={(e) => setDrafts((x) => ({ ...x, [d.id]: e.target.value }))}
                  placeholder="Add something Z80 should know"
                  className="h-9 flex-1 rounded-[9px] bg-transparent px-3 text-[13px] text-white placeholder:text-fg-4 hairline focus:outline-none"
                />
                <button type="submit" aria-label={`Add to ${d.label}`} className="flex h-9 w-9 items-center justify-center rounded-[9px] text-fg-3 hairline hover:text-white">
                  <Plus size={14} />
                </button>
              </form>
            </section>
          );
        })}
      </div>
    </PageWrap>
  );
}
