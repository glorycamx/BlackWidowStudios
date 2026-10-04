"use client";

import Link from "next/link";
import { ArrowUpRight, Bookmark, BookmarkCheck, X } from "lucide-react";
import { CopyButton, KindChip, TEMP_COLOR } from "@/components/signals/SignalParts";
import { Button } from "@/components/ui/Button";
import { useNow } from "@/lib/hooks/useNow";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { cn, missionCode, relativeTime } from "@/lib/utils";
import type { Signal } from "@/types";

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-2 px-1 text-[13px] text-fg-3">{title}</h3>}
      <ul className="divide-y divide-white/[0.06] overflow-hidden rounded-[18px] bg-white/[0.04]">{children}</ul>
    </section>
  );
}

function Row({ k, v, wrap, dim }: { k: string; v: string; wrap?: boolean; dim?: boolean }) {
  return (
    <li className={cn("flex gap-4 px-4 py-3 text-[15px]", wrap ? "flex-col gap-1 sm:flex-row sm:gap-4" : "items-center justify-between")}>
      <span className="shrink-0 text-fg-3 sm:w-[110px]">{k}</span>
      <span className={cn("min-w-0 break-words", wrap ? "text-left" : "truncate text-right", dim ? "text-fg-3" : "text-white", !wrap && "sm:flex-1")}>{v}</span>
    </li>
  );
}

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
  const mission = useWorkspace((s) => (signal.missionId ? s.missions[signal.missionId] : undefined));
  const related = useWorkspace((s) => (signal.reminder?.relatedSignalId ? s.signals.find((x) => x.id === signal.reminder?.relatedSignalId) : undefined));
  const l = signal.lead;

  return (
    <article className="overflow-hidden rounded-[28px] bg-[#0b0b10]" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }} aria-label={signal.title}>
      {l && <div aria-hidden className="h-px" style={{ background: `linear-gradient(90deg, transparent, ${TEMP_COLOR[l.temperature]}, transparent)` }} />}
      <header className="p-5 pb-1 md:p-6 md:pb-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <KindChip signal={signal} />
            {l && <span className="text-[12px] text-fg-3">Priority {l.priority}</span>}
            <span className="text-[12px] tabular-nums text-fg-4">{relativeTime(signal.at, now)} · sample</span>
          </div>
          {onClose && (
            <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-3 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
        <h2 className="mt-4 text-[clamp(28px,3vw,36px)] font-semibold leading-[1.05] tracking-[-0.035em] text-white">{signal.title}</h2>
        <p className="mt-2 text-[16px] leading-snug text-fg-2">
          <span className="text-white">{signal.trigger}.</span> {signal.summary}
        </p>
      </header>

      {l && (
        <div className="space-y-6 p-5 md:p-6">
          <Group>
            <Row k="Owner" v={`${l.owner}, ${l.ownerTitle}`} />
            <Row k="Phone" v={l.phone} />
            <Row k="Email" v={l.email} />
            <Row k="Website" v={l.currentWebsite} dim={l.currentWebsite === "None"} />
            <Row k="Location" v={l.location} />
          </Group>

          <Group title="Why now">
            {l.problems.map((p) => (
              <li key={p} className="flex items-center gap-3 px-4 py-3 text-[15px] text-white">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TEMP_COLOR[l.temperature] }} />
                {p}
              </li>
            ))}
          </Group>

          <Group title="Presence">
            <Row k="Google" v={`★ ${l.google.rating.toFixed(1)} · ${l.google.reviews} reviews`} />
            <Row k="Maps" v={l.google.mapPack} />
            <Row k="Reviews say" v={l.reviewsSummary} wrap />
            <Row k="Business" v={l.businessValue} wrap />
          </Group>

          <Group title="The pitch">
            <Row k="Offer" v={l.recommended.offer} wrap />
            <Row k="Price" v={l.recommended.price} />
            <Row k="Demo" v={l.demoAngle} wrap />
            {l.upsells.length > 0 && <Row k="Upsells" v={l.upsells.join(", ")} wrap />}
          </Group>

          <div>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[13px] text-fg-3">Opener, written by Beacon</span>
              <CopyButton text={l.outreachScript} label="Copy" />
            </div>
            <blockquote className="rounded-[18px] bg-white/[0.04] p-5 text-[16px] leading-[1.6] text-white">{l.outreachScript}</blockquote>
          </div>

          <div className="rounded-[18px] p-5" style={{ background: `${TEMP_COLOR[l.temperature]}12` }}>
            <div className="text-[13px] font-medium" style={{ color: TEMP_COLOR[l.temperature] }}>
              Next move
            </div>
            <p className="mt-1.5 text-[16px] leading-snug text-white">{l.nextMove}</p>
          </div>
        </div>
      )}

      {signal.news && (
        <div className="space-y-5 p-5 md:p-6">
          <Field label="Why it matters to you">{signal.news.whyItMatters}</Field>
          <p className="text-[12px] tabular-nums text-fg-4">Source: {signal.news.source}. Sample headline. Connect a news source for live briefings.</p>
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

      <footer className="flex flex-wrap items-center gap-2 px-5 pb-6 md:px-6">
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
        {mission && <span className="ml-auto text-[12px] text-fg-3">{mission.status === "complete" ? "Outreach done" : "Outreach in progress"}</span>}
      </footer>
    </article>
  );
}
