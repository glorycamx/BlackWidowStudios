"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, BookmarkCheck, Star, X } from "lucide-react";
import { ActorTag } from "@/components/app/primitives";
import { CopyButton, KindChip, TEMP_COLOR } from "@/components/signals/SignalParts";
import { Button } from "@/components/ui/Button";
import { useNow } from "@/lib/hooks/useNow";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { cn, missionCode, relativeTime } from "@/lib/utils";
import type { Signal } from "@/types";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="label mb-2 text-[9.5px]">{label}</div>
      <div className="text-[14px] leading-relaxed text-fg-1">{children}</div>
    </div>
  );
}

/** The full card for one signal: everything needed to act, in one place. */
export function SignalDetail({ signal, onClose }: { signal: Signal; onClose?: () => void }) {
  const now = useNow(20000);
  const watch = useWorkspace((s) => s.watches.find((w) => w.id === signal.watchId));
  const mission = useWorkspace((s) => (signal.missionId ? s.missions[signal.missionId] : undefined));
  const related = useWorkspace((s) => (signal.reminder?.relatedSignalId ? s.signals.find((x) => x.id === signal.reminder?.relatedSignalId) : undefined));
  const l = signal.lead;

  return (
    <article className="panel-solid overflow-hidden" aria-label={signal.title}>
      {l && <div aria-hidden className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${TEMP_COLOR[l.temperature]}, transparent)` }} />}
      <header className="border-b border-line p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <KindChip signal={signal} />
            {l && <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-3">Priority {l.priority}</span>}
            <span className="font-mono text-[10px] text-fg-4">{relativeTime(signal.at, now)}</span>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-3 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        <h2 className="mt-4 text-[clamp(24px,2.6vw,32px)] font-semibold leading-[1.05] tracking-[-0.035em] text-white">{signal.title}</h2>
        <p className="mt-2 text-[14.5px] text-fg-2">
          <span className="text-white">{signal.trigger}.</span> {signal.summary}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[12px] text-fg-3">
          {watch && (
            <span className="flex items-center gap-2">
              <ActorTag actor={watch.agentId} /> · {watch.name}
            </span>
          )}
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-fg-4">Simulated signal</span>
        </div>
      </header>

      {l && (
        <>
          <div className="grid gap-x-8 gap-y-6 p-5 md:grid-cols-2 md:p-6">
            <Field label="Business">
              <div className="text-white">{l.business}</div>
              <div className="text-fg-3">
                {l.industry} · {l.location}
              </div>
            </Field>
            <Field label="Owner">
              <div className="text-white">{l.owner}</div>
              <div className="text-fg-3">{l.ownerTitle}</div>
            </Field>
            <Field label="Contact">
              <div className="font-mono text-[13px]">{l.phone}</div>
              <div className="break-all font-mono text-[13px] text-fg-2">{l.email}</div>
            </Field>
            <Field label="Current website">
              <span className={cn("font-mono text-[13px]", l.currentWebsite === "None" ? "text-fg-3" : "text-fg-1")}>{l.currentWebsite}</span>
            </Field>
            <Field label={l.opportunity === "website" ? "Website problems" : "Operational gaps"} className="md:col-span-2">
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {l.problems.map((p) => (
                  <li key={p} className="flex gap-2.5">
                    <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full" style={{ background: TEMP_COLOR[l.temperature] }} />
                    {p}
                  </li>
                ))}
              </ul>
            </Field>
            <Field label="Google presence">
              <div className="flex items-center gap-1.5 text-white">
                <Star size={13} className="fill-current text-fg-1" />
                {l.google.rating.toFixed(1)} <span className="text-fg-3">· {l.google.reviews} reviews</span>
              </div>
              <div className="text-fg-3">
                Profile {l.google.profile.toLowerCase()} · {l.google.mapPack}
              </div>
            </Field>
            <Field label="Reviews">{l.reviewsSummary}</Field>
            <Field label="Business value">{l.businessValue}</Field>
            <Field label="Recommended">
              <div className="text-white">{l.recommended.offer}</div>
              <div className="font-mono text-[13px] text-fg-2">{l.recommended.price}</div>
            </Field>
            <Field label="Demo angle" className="md:col-span-2">
              {l.demoAngle}
            </Field>
            {l.upsells.length > 0 && (
              <Field label="Upsell opportunities" className="md:col-span-2">
                <div className="flex flex-wrap gap-1.5">
                  {l.upsells.map((u) => (
                    <span key={u} className="rounded-[7px] px-2.5 py-1 text-[12.5px] text-fg-1 hairline">
                      {u}
                    </span>
                  ))}
                </div>
              </Field>
            )}
          </div>

          <div className="border-t border-line p-5 md:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="label text-[9.5px]">
                Outreach script · <span className="text-beacon">Beacon</span>
              </div>
              <CopyButton text={l.outreachScript} label="Copy script" />
            </div>
            <blockquote className="mt-3 rounded-[12px] bg-white/[0.03] p-4 text-[15px] leading-[1.65] text-white">{l.outreachScript}</blockquote>
            <div className="mt-5 rounded-[12px] p-4" style={{ background: `${TEMP_COLOR[l.temperature]}0d`, boxShadow: `inset 0 0 0 1px ${TEMP_COLOR[l.temperature]}33` }}>
              <div className="label text-[9.5px]" style={{ color: TEMP_COLOR[l.temperature] }}>
                Next move
              </div>
              <p className="mt-2 text-[14.5px] text-white">{l.nextMove}</p>
            </div>
          </div>
        </>
      )}

      {signal.news && (
        <div className="space-y-5 p-5 md:p-6">
          <Field label="Why it matters to you">{signal.news.whyItMatters}</Field>
          <p className="font-mono text-[10.5px] text-fg-4">Source: {signal.news.source}. Sample headline. Connect a news source for live briefings.</p>
        </div>
      )}

      {signal.reminder && (
        <div className="space-y-5 p-5 md:p-6">
          <Field label="Due">{signal.reminder.due}</Field>
          {related && (
            <Field label="Lead">
              <Link href={`/signals?id=${related.id}`} className="inline-flex items-center gap-1.5 text-white hover:underline">
                {related.title} <ArrowUpRight size={13} />
              </Link>
            </Field>
          )}
        </div>
      )}

      <footer className="flex flex-wrap items-center gap-2 border-t border-line p-4 md:px-6">
        {l &&
          (mission ? (
            <Button variant="secondary" size="sm" href={`/missions/${mission.id}`} iconRight={<ArrowUpRight size={12} />}>
              Mission {missionCode(mission.number)}
            </Button>
          ) : (
            <Button variant="primary" size="sm" data-deploy onClick={() => workspace.deploySignal(signal.id)}>
              Deploy outreach
            </Button>
          ))}
        <Button variant="ghost" size="sm" icon={signal.saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />} onClick={() => workspace.toggleSaveSignal(signal.id)}>
          {signal.saved ? "Saved" : "Save"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            workspace.dismissSignal(signal.id);
            onClose?.();
          }}
        >
          Dismiss
        </Button>
        {mission && <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-fg-3">{mission.status === "complete" ? "Outreach done" : "Outreach in progress"}</span>}
      </footer>
    </article>
  );
}
