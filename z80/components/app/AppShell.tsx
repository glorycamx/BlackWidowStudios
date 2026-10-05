"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Brain, CheckCircle2, Command, MoreHorizontal, Plug, Radar, Search, Settings, Target, Users } from "lucide-react";
import { SignalToasts } from "@/components/signals/SignalToasts";
import { NAV_LABELS } from "@/lib/copy";
import { Kbd } from "@/components/ui/Kbd";
import { Wordmark } from "@/components/z80/Wordmark";
import { openCommandPalette } from "@/components/z80/CommandPalette";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { agents } from "@/data/bots";
import { selectPendingApprovals, selectUnreadHot, useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/live", label: NAV_LABELS.live, icon: Radar },
  { href: "/chat", label: NAV_LABELS.chat, icon: Command },
  { href: "/team", label: NAV_LABELS.team, icon: Users },
  { href: "/jobs", label: NAV_LABELS.jobs, icon: Target },
  { href: "/memory", label: NAV_LABELS.memory, icon: Brain },
  { href: "/apps", label: NAV_LABELS.apps, icon: Plug },
  { href: "/activity", label: NAV_LABELS.activity, icon: Activity },
];

const MOBILE = [
  { href: "/live", label: NAV_LABELS.live, icon: Radar },
  { href: "/chat", label: NAV_LABELS.chat, icon: Command },
  { href: "/team", label: "Team", icon: Users },
  { href: "/approvals", label: NAV_LABELS.approvals, icon: CheckCircle2 },
  { href: "/settings", label: "More", icon: MoreHorizontal },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hydrated = useWorkspace((s) => s.hydrated);
  const pending = useWorkspace(selectPendingApprovals).length;
  const org = useWorkspace((s) => s.org);
  const hot = useWorkspace(selectUnreadHot);

  return (
    <div className="relative min-h-dvh bg-black">
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 h-[40vh] bg-[radial-gradient(60%_100%_at_60%_0%,rgba(69,108,255,0.07),transparent_70%)]" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-line bg-[#020203]/80 backdrop-blur-xl lg:flex">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="text-[19px]" aria-label="Z80.si home">
            <Wordmark />
          </Link>
          <span className="label text-fg-4">Demo</span>
        </div>
        <button
          onClick={openCommandPalette}
          className="mx-3 mb-4 flex h-9 items-center gap-2.5 rounded-[10px] px-3 text-[13px] text-fg-3 transition-colors hairline hover:text-fg-1"
        >
          <Search size={14} />
          <span className="flex-1 text-left">Search or command</span>
          <Kbd>⌘K</Kbd>
        </button>
        <nav aria-label="Workspace" className="flex flex-1 flex-col px-3">
          <ul className="space-y-0.5">
            {NAV.map((n) => (
              <li key={n.href}>
                <NavLink
                  href={n.href}
                  label={n.label}
                  icon={<n.icon size={15} />}
                  active={isActive(path, n.href)}
                  badge={n.href === "/live" && hydrated && hot > 0 ? hot : undefined}
                  badgeTone="hot"
                />
              </li>
            ))}
          </ul>
          <div className="my-4 h-px bg-line" />
          <NavLink
            href="/approvals"
            label={NAV_LABELS.approvals}
            icon={<CheckCircle2 size={15} />}
            active={isActive(path, "/approvals")}
            badge={hydrated && pending > 0 ? pending : undefined}
          />

          <div className="mt-8 px-2.5">
            <div className="label mb-3">Your team</div>
            <ul className="space-y-2">
              {agents
                .filter((a) => a.availability === "available")
                .map((a) => (
                  <li key={a.id}>
                    <Link href={`/team/${a.slug}`} className="group flex items-center gap-2.5 text-[12.5px] text-fg-3 transition-colors hover:text-fg-1">
                      <AgentGlyph agent={a} size={20} animated={false} />
                      {a.name}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>

          <div className="mt-auto space-y-0.5 pb-3">
            <NavLink href="/settings" label="Settings" icon={<Settings size={15} />} active={isActive(path, "/settings")} />
            <Link href="/settings#account" className="mt-2 flex items-center gap-3 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-white/[0.03]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#2a2f55] to-[#121218] text-[11px] font-semibold text-white hairline">
                {(org?.name ?? "Z").slice(0, 1)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] text-fg-1">{hydrated ? org?.name ?? "Your company" : "—"}</span>
                <span className="block text-[11px] text-fg-3">Demo workspace</span>
              </span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-black/70 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" className="text-[18px]" aria-label="Z80.si home">
          <Wordmark />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={openCommandPalette} aria-label="Open command palette" className="flex h-10 w-10 items-center justify-center text-fg-2">
            <Search size={17} />
          </button>
          <Link href="/activity" aria-label="Activity" className="flex h-10 w-10 items-center justify-center text-fg-2">
            <Activity size={17} />
          </Link>
        </div>
      </header>

      <main id="main" className="relative pb-24 lg:pb-0 lg:pl-[232px]">
        {hydrated ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={path} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AssemblingContext />
        )}
      </main>

      {hydrated && <SignalToasts />}

      {/* Mobile tab bar */}
      <nav aria-label="Workspace" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-black/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {MOBILE.map((n) => {
            const on = isActive(path, n.href);
            return (
              <li key={n.href}>
                <Link href={n.href} aria-current={on ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-1.5 text-[10px] tracking-[0.04em]", on ? "text-white" : "text-fg-3")}>
                  <span className="relative">
                    <n.icon size={18} />
                    {n.href === "/live" && hydrated && hot > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6f91] px-1 text-[12px] tabular-nums text-black">{hot}</span>
                    )}
                    {n.href === "/approvals" && hydrated && pending > 0 && (
                      <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-attn px-1 text-[12px] tabular-nums text-black">{pending}</span>
                    )}
                  </span>
                  {n.label}
                  {on && <motion.span layoutId="tab-dot" className="absolute top-0 h-px w-8 bg-white" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function NavLink({ href, label, icon, active, badge, badgeTone }: { href: string; label: string; icon: React.ReactNode; active: boolean; badge?: number; badgeTone?: "hot" }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[13.5px] transition-colors duration-150",
        active ? "bg-white/[0.06] text-white" : "text-fg-3 hover:bg-white/[0.025] hover:text-fg-1",
      )}
    >
      {active && <motion.span layoutId="nav-active" className="absolute -left-3 top-2 h-5 w-px bg-white" transition={{ duration: 0.3, ease: EASE }} />}
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] tabular-nums"
          style={
            badgeTone === "hot"
              ? { color: "#ff6f91", background: "rgba(255,111,145,0.14)", boxShadow: "inset 0 0 0 1px rgba(255,111,145,0.35)" }
              : { color: "var(--color-attn)", background: "rgba(215,123,255,0.14)", boxShadow: "inset 0 0 0 1px rgba(215,123,255,0.3)" }
          }
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

/** Contextual loading — never a generic spinner. */
export function AssemblingContext({ text = "Z80 is assembling context…" }: { text?: string }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-5">
        <div className="relative h-10 w-10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.span
              key={i}
              className="absolute h-1 w-1 rounded-full bg-[#8f9cff]"
              style={{ left: Math.round(18 + Math.cos((i / 6) * Math.PI * 2) * 14), top: Math.round(18 + Math.sin((i / 6) * Math.PI * 2) * 14) }}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
        <span className="label">{text}</span>
      </div>
    </div>
  );
}
