"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { MissionResults as Results, Prospect } from "@/types";

function toCsv(rows: Prospect[]) {
  const head = ["Company", "Location", "Owner", "Title", "Signal", "Score", "Opening line"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  return [head.map(esc).join(","), ...rows.map((r) => [r.company, r.location, r.owner, r.title, r.signal, r.score, r.opener].map(esc).join(","))].join("\n");
}

/** Mission deliverables. All data here is simulated in the demo build. */
export function MissionResults({ results, missionNumber }: { results: Results; missionNumber: number }) {
  return (
    <section id="results" aria-label="Results" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="label">Results</div>
          <h2 className="mt-3 text-[28px] font-semibold tracking-[-0.035em] text-white">{results.headline}</h2>
          <p className="mt-1.5 text-[14.5px] text-fg-2">{results.summary}</p>
        </div>
        <span className="label text-fg-4">Simulated demo data</span>
      </div>
      <div className="mt-8">
        {results.prospects && <Prospects rows={results.prospects} missionNumber={missionNumber} />}
        {results.concepts && (
          <div className="grid gap-4 md:grid-cols-3">
            {results.concepts.map((c, i) => (
              <div key={c.id} className="panel p-5">
                <div className="text-[12px] tabular-nums text-fg-3">Direction {String.fromCharCode(65 + i)}</div>
                <div className="mt-3 text-[18px] font-medium tracking-[-0.02em] text-white">{c.name}</div>
                <p className="mt-3 text-[15px] italic text-fg-1">“{c.hook}”</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-fg-2">{c.body}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {c.channels.map((ch) => (
                    <span key={ch} className="rounded-[6px] px-2 py-1 text-[12px] text-fg-3 hairline">
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {results.outreach && (
          <div className="panel p-5 md:p-6">
            <div className="label">
              To {results.outreach.to} · {results.outreach.business}
            </div>
            <blockquote className="mt-4 text-[16px] leading-[1.65] text-white">“{results.outreach.script}”</blockquote>
          </div>
        )}
        {results.findings && (
          <ul className="divide-y divide-white/[0.07] border-y border-line">
            {results.findings.map((f) => (
              <li key={f.id} className="grid gap-2 py-5 md:grid-cols-[160px_1fr_1fr] md:gap-6">
                <span className="text-[12px] text-fg-3">{f.subject}</span>
                <span className="text-[14.5px] text-white">{f.finding}</span>
                <span className="text-[14px] text-fg-2">→ {f.implication}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Prospects({ rows, missionNumber }: { rows: Prospect[]; missionNumber: number }) {
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const shown = all ? rows : rows.slice(0, 10);

  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `z80-mission-${missionNumber}-prospects.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="label">{rows.length} prospects</span>
        <Button variant="ghost" size="sm" icon={<Download size={13} />} onClick={download}>
          Export CSV
        </Button>
      </div>
      <div className="hidden grid-cols-[1.4fr_1fr_1.2fr_70px_20px] gap-4 border-b border-line px-5 py-3 text-[12px] text-fg-3 md:grid">
        <span>Company</span>
        <span>Decision maker</span>
        <span>Signal</span>
        <span className="text-right">Score</span>
        <span />
      </div>
      <ul>
        {shown.map((p) => {
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="border-b border-white/[0.04] last:border-0">
              <button onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen} className="grid w-full grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.02] md:grid-cols-[1.4fr_1fr_1.2fr_70px_20px] md:items-center">
                <span>
                  <span className="block text-[14px] text-white">{p.company}</span>
                  <span className="block text-[12px] text-fg-3">{p.location}</span>
                </span>
                <span className="text-right text-[13px] text-fg-2 md:text-left">
                  {p.owner}
                  <span className="block text-[11.5px] text-fg-3">{p.title}</span>
                </span>
                <span className="text-[13px] text-fg-2">{p.signal}</span>
                <span className="text-right font-mono text-[13px] text-white">{p.score}</span>
                <ChevronDown size={14} className={cn("hidden text-fg-3 transition-transform md:block", isOpen && "rotate-180")} />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                    <div className="px-5 pb-5">
                      <div className="rounded-[12px] bg-white/[0.025] p-4">
                        <div className="text-[12px] text-creator">Content Creator · opening line</div>
                        <p className="mt-2 text-[14.5px] leading-relaxed text-fg-1">“{p.opener}”</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>
      {rows.length > 10 && (
        <div className="border-t border-line px-5 py-3">
          <button onClick={() => setAll((a) => !a)} className="text-[12px] text-fg-2 hover:text-white">
            {all ? "Show fewer" : `Show all ${rows.length}`}
          </button>
        </div>
      )}
    </div>
  );
}
