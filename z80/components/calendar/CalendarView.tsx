"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Check, Clock } from "lucide-react";
import { PageHeader, PageWrap } from "@/components/app/primitives";
import { Button } from "@/components/ui/Button";
import { channelLabel } from "@/lib/sim/generators";
import { useNow } from "@/lib/hooks/useNow";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { formatCountdown, formatLocalTime, startOfDay } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { ScheduledPost } from "@/types";

const STATUS: Record<ScheduledPost["status"], { label: string; color: string }> = {
  draft: { label: "Draft", color: "#8e93a8" },
  "needs-ok": { label: "Needs your OK", color: "#d77bff" },
  scheduled: { label: "Scheduled", color: "#8f9cff" },
  posted: { label: "Posted", color: "#5fd39a" },
  missed: { label: "Held", color: "#ff8ca0" },
  skipped: { label: "Skipped", color: "#686872" },
};

/** Posts in a row that went out on the exact minute. */
function streak(posts: ScheduledPost[]) {
  let n = 0;
  const done = posts.filter((p) => p.status === "posted" || p.status === "missed").sort((a, b) => b.scheduledFor - a.scheduledFor);
  for (const p of done) {
    if (p.status === "posted" && p.postedAt === p.scheduledFor) n++;
    else break;
  }
  return n;
}

/** The content calendar: what Content Creator will post, and when, to the minute. */
export function CalendarView() {
  const posts = useWorkspace((s) => s.posts);
  const now = useNow(1000);
  const [view, setView] = useState<"week" | "list">("week");
  const needOk = posts.filter((p) => p.status === "needs-ok" && p.scheduledFor > now).length;
  const next = posts.find((p) => p.status === "scheduled" && p.scheduledFor > now);
  const onTime = streak(posts);

  return (
    <PageWrap>
      <PageHeader
        label="Content Creator"
        title="Content calendar"
        sub="Drafted in your voice. Posted on the exact minute."
        actions={
          <Button variant="secondary" size="sm" onClick={() => workspace.schedulePostSoon()} title="Demo control">
            Add a test post in 1 minute
          </Button>
        }
      />

      <section aria-label="Summary" className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 sm:grid-cols-3">
        <div>
          <div className="text-[clamp(26px,2.6vw,34px)] font-medium tabular-nums text-white">{onTime}</div>
          <div className="mt-1.5 text-[13px] text-fg-3">On time in a row</div>
        </div>
        <div>
          <div className="text-[clamp(26px,2.6vw,34px)] font-medium tabular-nums" style={{ color: needOk ? "#d77bff" : "var(--color-fg)" }}>
            {needOk}
          </div>
          <div className="mt-1.5 text-[13px] text-fg-3">Need your OK</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-[clamp(20px,2vw,26px)] font-medium tabular-nums text-white">{next ? `${formatLocalTime(next.scheduledFor)}` : "Nothing queued"}</div>
          <div className="mt-1.5 text-[13px] text-fg-3">{next ? `Next post, ${formatCountdown(next.scheduledFor, now)}` : "Next post"}</div>
        </div>
      </section>

      <div role="tablist" aria-label="View" className="mt-8 flex gap-1">
        {(["week", "list"] as const).map((v) => (
          <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cn("h-8 rounded-[9px] px-3 text-[13px] capitalize transition-colors", view === v ? "bg-white/[0.08] text-white" : "text-fg-3 hover:text-fg-1")}>
            {v === "week" ? "Week" : "List"}
          </button>
        ))}
      </div>

      {view === "week" ? <Week posts={posts} now={now} /> : <List posts={posts} now={now} />}
    </PageWrap>
  );
}

function Week({ posts, now }: { posts: ScheduledPost[]; now: number }) {
  const start = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, i) => new Date(new Date(start).setDate(new Date(start).getDate() + i)).getTime());
  return (
    <div className="mt-6 grid gap-3 md:grid-cols-7">
      {days.map((d, i) => {
        const end = days[i + 1] ?? d + 86400e3;
        const mine = posts.filter((p) => p.scheduledFor >= d && p.scheduledFor < end);
        return (
          <section key={d} className="min-w-0" aria-label={new Date(d).toLocaleDateString("en-US", { weekday: "long" })}>
            <h2 className={cn("mb-2 text-[13px]", i === 0 ? "text-white" : "text-fg-3")}>
              {i === 0 ? "Today" : new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
            </h2>
            <ul className="space-y-2">
              {mine.length === 0 && <li className="rounded-[14px] px-3 py-4 text-[12px] text-fg-4 hairline">No posts</li>}
              {mine.map((p) => (
                <PostCard key={p.id} post={p} now={now} compact />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function List({ posts, now }: { posts: ScheduledPost[]; now: number }) {
  const upcoming = posts.filter((p) => p.scheduledFor > now);
  const recent = posts.filter((p) => p.scheduledFor <= now).reverse().slice(0, 12);
  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-2">
      <section>
        <h2 className="label mb-3">Coming up</h2>
        <ul className="space-y-2">
          {upcoming.map((p) => (
            <PostCard key={p.id} post={p} now={now} />
          ))}
        </ul>
      </section>
      <section>
        <h2 className="label mb-3">Already out</h2>
        <ul className="space-y-2">
          {recent.map((p) => (
            <PostCard key={p.id} post={p} now={now} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function PostCard({ post: p, now, compact }: { post: ScheduledPost; now: number; compact?: boolean }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(p.caption);
  const st = STATUS[p.status];
  const onTime = p.status === "posted" && p.postedAt === p.scheduledFor;
  const canApprove = p.status === "needs-ok" || p.status === "draft" || (p.status === "missed" && now - p.scheduledFor < 6 * 3600e3);
  const canChange = p.status !== "posted" && p.status !== "skipped";
  const soon = p.status === "scheduled" && p.scheduledFor - now < 120e3 && p.scheduledFor > now;
  return (
    <motion.li layout="position" transition={{ duration: 0.35, ease: EASE }} className={cn("rounded-[16px] bg-white/[0.03] p-3.5 hairline", p.status === "skipped" && "opacity-50")}>
      <div className={cn("flex justify-between gap-2", compact ? "flex-col items-start" : "items-center")}>
        <span className="whitespace-nowrap text-[13px] tabular-nums text-white">{formatLocalTime(p.scheduledFor)}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={p.status} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex h-5 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[11px]" style={{ color: st.color, background: `${st.color}1a` }}>
            {p.status === "posted" && <Check size={10} />}
            {soon && <Clock size={10} />}
            {soon ? formatCountdown(p.scheduledFor, now) : compact && p.status === "needs-ok" ? "Needs OK" : st.label}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-1 text-[12px] text-fg-3">{channelLabel(p.channel)}</div>
      {editing ? (
        <form
          className="mt-2"
          onSubmit={(e) => {
            e.preventDefault();
            workspace.editPost(p.id, text);
            setEditing(false);
          }}
        >
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} aria-label="Caption" className="w-full resize-none rounded-[10px] bg-white/[0.05] p-2.5 text-[13px] leading-snug text-white hairline focus:outline-none" />
          <div className="mt-2 flex gap-2">
            <button type="submit" className="h-7 rounded-full bg-white px-3 text-[12px] font-medium text-black">Save</button>
            <button type="button" onClick={() => setEditing(false)} className="h-7 px-2 text-[12px] text-fg-3">Cancel</button>
          </div>
        </form>
      ) : (
        <p className={cn("mt-2 text-[13px] leading-snug text-fg-1", compact && "line-clamp-3")}>{p.caption}</p>
      )}
      {p.status === "posted" && (
        <div className="mt-2 text-[12px] tabular-nums" style={{ color: onTime ? "#5fd39a" : undefined }}>
          Scheduled {formatLocalTime(p.scheduledFor)} · Posted {formatLocalTime(p.postedAt ?? p.scheduledFor)}
        </div>
      )}
      {!editing && (canApprove || canChange) && (
        <div className={cn("mt-3 flex flex-wrap", compact ? "gap-0.5" : "gap-1.5")}>
          {canApprove && (
            <button onClick={() => workspace.approvePost(p.id)} className={cn("h-7 rounded-full bg-white text-[12px] font-medium text-black hover:opacity-85", compact ? "px-2.5" : "px-3")}>
              {p.scheduledFor <= now ? "Post now" : compact ? "OK" : "Approve"}
            </button>
          )}
          {canChange && (
            <>
              <button onClick={() => setEditing(true)} className={cn("h-7 rounded-full text-[12px] text-fg-2 hover:text-white", compact ? "px-1.5" : "px-2.5 hairline")}>
                Edit
              </button>
              <button onClick={() => workspace.skipPost(p.id)} className={cn("h-7 rounded-full text-[12px] text-fg-3 hover:text-white", compact ? "px-1.5" : "px-2.5")}>
                Skip
              </button>
            </>
          )}
        </div>
      )}
    </motion.li>
  );
}
