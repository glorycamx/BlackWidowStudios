"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as clock from "@/lib/sim/clock";
import { runEngine } from "@/lib/sim/generators";
import { formatClockString } from "@/lib/time";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { ThemeSwitch } from "@/components/app/ThemeSwitch";
import { openWelcome } from "@/components/app/WelcomeTour";
import { PageHeader, PageWrap, Panel } from "@/components/app/primitives";
import { Button } from "@/components/ui/Button";
import { getAuthProvider, type AuthUser } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { useWorkspace, workspace } from "@/lib/store/workspace";
import { cn } from "@/lib/utils";

function Toggle({ on, onChange, label }: { on: boolean; onChange(v: boolean): void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-11 rounded-full transition-colors duration-300", on ? "bg-white" : "bg-white/[0.08] hairline")}
    >
      <span className={cn("absolute top-1 h-4 w-4 rounded-full transition-all duration-300 ease-[var(--ease-z)]", on ? "left-6 bg-black" : "left-1 bg-fg-2")} />
    </button>
  );
}

export function SettingsView() {
  const router = useRouter();
  const settings = useWorkspace((s) => s.settings);
  const org = useWorkspace((s) => s.org);
  const permissions = useWorkspace((s) => s.permissions);
  const [name, setName] = useState(org?.name ?? "");
  const [desc, setDesc] = useState(org?.description ?? "");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [saved, setSaved] = useState(false);
  const auth = getAuthProvider();

  useEffect(() => {
    void auth.getUser().then(setUser);
  }, [auth]);

  return (
    <PageWrap className="max-w-[920px]">
      <PageHeader label="Your workspace" title="Settings" />
      <nav aria-label="More" className="mt-8 grid grid-cols-2 gap-2 lg:hidden">
        {[
          ["Your team", "/team"],
          ["Memory", "/memory"],
          ["Routines", "/routines"],
          ["Content calendar", "/calendar"],
          ["Jobs", "/jobs"],
          ["Apps", "/apps"],
          ["Activity", "/activity"],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="flex h-12 items-center justify-between rounded-[12px] px-4 text-[14px] text-white hairline">
            {label} <span className="text-fg-3">→</span>
          </Link>
        ))}
      </nav>
      <div className="mt-12 space-y-6">
        <Panel title="Organization">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              workspace.setOrg({ name: name.trim() || "Your company", description: desc.trim(), focus: org?.focus ?? "" });
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
          >
            <label className="grid gap-2">
              <span className="text-[13px] text-fg-2">Company name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 rounded-[10px] bg-transparent px-3 text-[14px] text-white hairline focus:outline-none" />
            </label>
            <label className="grid gap-2">
              <span className="text-[13px] text-fg-2">What the company does</span>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="resize-none rounded-[10px] bg-transparent px-3 py-2.5 text-[14px] text-white hairline focus:outline-none" />
            </label>
            <div className="flex items-center gap-3">
              <Button type="submit" variant="solid" size="sm" magnetic={false}>
                Save
              </Button>
              {saved && <span className="text-[12.5px] text-fg-2" role="status">Saved to organization memory.</span>}
            </div>
          </form>
        </Panel>

        <Panel title="Appearance">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[14.5px] text-white">Light or dark</div>
              <div className="mt-0.5 text-[13px] text-fg-3">Auto matches your device.</div>
            </div>
            <ThemeSwitch className="w-full sm:w-[260px]" />
          </div>
          <div className="mt-5 flex items-center justify-between gap-6 border-t border-line pt-5">
            <div>
              <div className="text-[14.5px] text-white">Welcome tour</div>
              <div className="mt-0.5 text-[13px] text-fg-3">The four-card intro you saw on day one.</div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => openWelcome()}>
              Show it again
            </Button>
          </div>
        </Panel>

        <ReachPanel />

        <TimeTravelPanel />

        <Panel title="Interface">
          <div className="flex items-center justify-between gap-6 py-1">
            <div>
              <div className="text-[14.5px] text-white">Interface sound</div>
              <div className="mt-0.5 text-[13px] text-fg-3">Soft tones for new jobs, finished work, approvals and replies.</div>
            </div>
            <Toggle
              on={settings.sound}
              label="Interface sound"
              onChange={(v) => {
                workspace.setSettings({ sound: v });
                if (v) playSound("complete", true);
              }}
            />
          </div>
          <div className="mt-5 flex items-center justify-between gap-6 border-t border-line pt-5">
            <div>
              <div className="text-[14.5px] text-white">Demo speed</div>
              <div className="mt-0.5 text-[13px] text-fg-3">How fast the simulation runs: jobs, routines and checks.</div>
            </div>
            <div role="radiogroup" aria-label="Demo speed" className="flex rounded-[9px] p-[3px] hairline">
              {[1, 2, 4].map((sp) => (
                <button
                  key={sp}
                  role="radio"
                  aria-checked={settings.demoSpeed === sp}
                  onClick={() => workspace.setSettings({ demoSpeed: sp })}
                  className={cn("h-7 rounded-[7px] px-3 text-[13px] tabular-nums", settings.demoSpeed === sp ? "bg-white/[0.08] text-white" : "text-fg-3")}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Permissions">
          <ul>
            {permissions.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 border-b border-white/[0.05] py-3.5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[14px] text-white">{p.action}</div>
                  <div className="text-[12.5px] text-fg-3">{p.detail}</div>
                </div>
                <PermissionSwitch value={p.level} onChange={(l) => workspace.setPermission(p.id, l)} label={p.action} />
              </li>
            ))}
          </ul>
        </Panel>

        <section id="account">
          <Panel title="Account">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-[14.5px] text-white">{user?.name ?? "Demo visitor"}</div>
                <div className="text-[13px] text-fg-3">{user?.email ?? "Not signed in"}</div>
              </div>
              {user ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    await auth.signOut();
                    setUser(null);
                    router.push("/");
                  }}
                >
                  Sign out
                </Button>
              ) : (
                <Button variant="secondary" size="sm" href="/login">
                  Sign in
                </Button>
              )}
            </div>
            {!auth.secure && <p className="mt-4 text-[12.5px] text-fg-3">Authentication in this demo build is simulated and provides no security. Data stays in this browser.</p>}
          </Panel>
        </section>

        <Panel title="Demo workspace">
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] text-fg-2">All jobs, routines, activity and memory in this demo live in your browser.</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => workspace.resetDemo()}>
                Reset demo workspace
              </Button>
              <Button variant="secondary" size="sm" onClick={() => workspace.clearWorkspace()}>
                Start empty
              </Button>
              <Button variant="ghost" size="sm" onClick={() => workspace.clearConversation()}>
                Clear conversation
              </Button>
            </div>
          </div>
        </Panel>
      </div>
    </PageWrap>
  );
}

const TIMES = ["05:00", "05:30", "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "17:00", "17:30", "18:00", "18:30", "19:00", "20:00", "21:00", "22:00", "23:00"];

function TimeSelect({ value, onChange, label }: { value: string; onChange(v: string): void; label: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-[10px] bg-[var(--surface-input)] px-3 text-[14px] text-white hairline focus:outline-none">
      {(TIMES.includes(value) ? TIMES : [value, ...TIMES]).map((t) => (
        <option key={t} value={t}>
          {formatClockString(t)}
        </option>
      ))}
    </select>
  );
}

/** How your bots reach you: morning text, recap, quiet hours, browser alerts. */
function ReachPanel() {
  const settings = useWorkspace((s) => s.settings);
  const feed = useWorkspace((s) => s.feed);
  const posts = useWorkspace((s) => s.posts);
  const pending = useWorkspace((s) => Object.values(s.approvals).filter((a) => a.status === "pending").length);
  const routine = useWorkspace((s) => s.routines.find((r) => r.engine === "morning-text"));
  const [perm, setPerm] = useState<string>(() => (typeof Notification === "undefined" ? "unsupported" : Notification.permission));
  const preview = useMemo(() => {
    if (!routine) return null;
    const now = clock.now();
    return runEngine(routine, { now, seq: 1, feed, posts, pendingApprovals: pending, since: now - 12 * 3600e3 });
  }, [routine, feed, posts, pending]);

  return (
    <Panel title="How your bots reach you">
      <div className="grid gap-5">
        <Row title="Morning text" sub="What happened overnight, in a few lines.">
          <TimeSelect label="Morning text time" value={settings.morningTextAt ?? "06:00"} onChange={(v) => workspace.setReachTimes({ morningTextAt: v })} />
        </Row>
        <Row title="Evening recap" sub="Your day, wrapped up.">
          <TimeSelect label="Evening recap time" value={settings.recapAt ?? "18:00"} onChange={(v) => workspace.setReachTimes({ recapAt: v })} />
        </Row>
        <Row title="Quiet hours" sub="Only hot leads and things that need you get through.">
          <div className="flex items-center gap-2 text-[13px] text-fg-3">
            <TimeSelect label="Quiet from" value={settings.quietFrom ?? "22:00"} onChange={(v) => workspace.setReachTimes({ quietFrom: v })} />
            to
            <TimeSelect label="Quiet until" value={settings.quietTo ?? "06:00"} onChange={(v) => workspace.setReachTimes({ quietTo: v })} />
          </div>
        </Row>
        <Row title="Browser alerts" sub={perm === "denied" ? "Blocked in your browser settings." : perm === "unsupported" ? "Not supported in this browser." : "Desktop alerts when the tab is in the background. Demo."}>
          <Toggle
            on={!!settings.browserAlerts && perm === "granted"}
            label="Browser alerts"
            onChange={async (v) => {
              if (!v) return workspace.setSettings({ browserAlerts: false });
              if (typeof Notification === "undefined") return;
              const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
              setPerm(p);
              workspace.setSettings({ browserAlerts: p === "granted" });
            }}
          />
        </Row>
        <Row title="Text, WhatsApp, Slack, email, phone call" sub="Your bots will reach you where you are.">
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] text-fg-3">Coming soon</span>
        </Row>
        {preview?.digest && (
          <div className="rounded-[18px] bg-white/[0.03] p-4 hairline">
            <div className="text-[12px] text-fg-3">Preview: tomorrow&apos;s morning text at {formatClockString(settings.morningTextAt ?? "06:00")}</div>
            <div className="mt-2 text-[15px] font-medium text-white">{preview.title}</div>
            <ul className="mt-1.5 space-y-1 text-[14px] text-fg-2">
              {preview.digest.lines.map((l, i) => (
                <li key={i}>{l.text}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-white/[0.05] pb-5 last:border-0 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="text-[14.5px] text-white">{title}</div>
        <div className="mt-0.5 text-[13px] text-fg-3">{sub}</div>
      </div>
      {children}
    </div>
  );
}

const TRAVEL = [
  ["03:00", "3:00 AM"],
  ["06:05", "6:05 AM"],
  ["12:30", "12:30 PM"],
  ["18:05", "6:05 PM"],
  ["23:30", "11:30 PM"],
] as const;

/** Demo: see what the bots look like at another time of day. */
function TimeTravelPanel() {
  const traveling = useWorkspace((s) => s.traveling);
  return (
    <Panel title="Time travel">
      <p className="text-[13.5px] text-fg-2">See your bots at another time of day. It opens a fresh demo at that time and doesn&apos;t touch your saved workspace.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {TRAVEL.map(([v, label]) => (
          <button key={v} onClick={() => workspace.travel(v)} className={cn("h-8 rounded-full px-3 text-[13px] transition-colors", traveling === v ? "bg-white text-black" : "bg-white/[0.06] text-fg-1 hover:bg-white/[0.1]")}>
            {label}
          </button>
        ))}
        {traveling && (
          <button onClick={() => workspace.travel(null)} className="h-8 rounded-full px-3 text-[13px] text-[#e6b8ff] hover:text-white">
            Back to now
          </button>
        )}
      </div>
    </Panel>
  );
}
