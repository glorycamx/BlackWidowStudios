"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Brain,
  CalendarDays,
  ChevronsUpDown,
  Inbox,
  Menu,
  MessagesSquare,
  PanelLeft,
  Plug,
  Plus,
  Repeat,
  Search,
  Settings,
  SquarePen,
  Target,
  X,
} from "lucide-react";
import { AgentGlyph } from "@/components/agents/AgentGlyph";
import { PhoneToasts } from "@/components/app/Notifications";
import { ThemeSwitch } from "@/components/app/ThemeSwitch";
import { WelcomeTour } from "@/components/app/WelcomeTour";
import { useWorkingBots } from "@/components/bots/useBot";
import { CreateBotDialog } from "@/components/bots/CreateBotDialog";
import { Portal } from "@/components/ui/Portal";
import { Wordmark } from "@/components/z80/Wordmark";
import { openCommandPalette } from "@/components/z80/CommandPalette";
import { selectPendingApprovals, selectUnreadHot, useWorkspace, workspace } from "@/lib/store/workspace";
import { useBeats } from "@/lib/sim/heartbeats";
import { useAppTheme } from "@/lib/theme";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import type { Agent } from "@/types";

const COLLAPSE_KEY = "z80.sidebar.collapsed";

/** Everything that isn't daily lives in the profile menu. */
const MENU = [
  { href: "/calendar", label: "Content calendar", icon: CalendarDays },
  { href: "/jobs", label: "Jobs", icon: Target },
  { href: "/chat?tab=team", label: "Team chat", icon: MessagesSquare },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/apps", label: "Apps", icon: Plug },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

/**
 * The app frame, ChatGPT-style: a quiet sidebar (new agent, inbox, your
 * agents like a chat list, profile menu) and one big content area.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const hydrated = useWorkspace((s) => s.hydrated);
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  useAppTheme();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => setDrawer(false), [path]);

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !c;
    });
  };

  return (
    <div className="relative min-h-dvh bg-[var(--surface-canvas)]">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col bg-[var(--surface-sidebar)] transition-transform duration-300 ease-[var(--ease-z)] lg:flex",
          collapsed && "-translate-x-full",
        )}
        aria-label="Sidebar"
      >
        <Sidebar onCollapse={toggle} />
      </aside>
      {collapsed && (
        <div className="fixed left-3 top-3 z-30 hidden gap-1 lg:flex">
          <IconButton label="Open sidebar" onClick={toggle}>
            <PanelLeft size={18} />
          </IconButton>
          <NewAgentIcon />
        </div>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-[var(--surface-canvas)]/90 px-2 backdrop-blur-xl lg:hidden">
        <IconButton label="Open menu" onClick={() => setDrawer(true)}>
          <Menu size={20} />
        </IconButton>
        <Link href="/chat" className="text-[17px]" aria-label="Z80 home">
          <Wordmark />
        </Link>
        <NewAgentIcon />
      </header>

      {/* Mobile drawer */}
      <Portal>
        <AnimatePresence>
          {drawer && (
            <motion.div className="fixed inset-0 z-[80] bg-[rgb(0_0_0/0.45)] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawer(false)}>
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.3, ease: EASE }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-y-0 left-0 flex w-[min(300px,86vw)] flex-col bg-[var(--surface-sidebar)]"
                aria-label="Menu"
              >
                <Sidebar onClose={() => setDrawer(false)} />
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      <main id="main" className={cn("relative flex min-h-[calc(100dvh-3.5rem)] flex-col transition-[padding] duration-300 lg:min-h-dvh", !collapsed && "lg:pl-[264px]")}>
        {hydrated ? (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={path} className="flex flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {children}
            </motion.div>
          </AnimatePresence>
        ) : (
          <AssemblingContext />
        )}
      </main>

      {hydrated && <PhoneToasts />}
      {hydrated && <WelcomeTour />}
    </div>
  );
}

/** Start a fresh conversation with Manager. */
function useNewAgent() {
  const router = useRouter();
  return () => {
    workspace.clearConversation();
    router.push("/chat?focus=1");
  };
}

function NewAgentIcon() {
  const start = useNewAgent();
  return (
    <IconButton label="Deploy a new agent" onClick={start}>
      <SquarePen size={18} />
    </IconButton>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick(): void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex h-10 w-10 items-center justify-center rounded-[10px] text-fg-2 transition-colors hover:bg-white/[0.06] hover:text-white">
      {children}
    </button>
  );
}

function Sidebar({ onCollapse, onClose }: { onCollapse?(): void; onClose?(): void }) {
  const path = usePathname();
  const start = useNewAgent();
  const hydrated = useWorkspace((s) => s.hydrated);
  const pending = useWorkspace(selectPendingApprovals).length;
  const hot = useWorkspace(selectUnreadHot);
  const agents = useWorkingBots();
  const [creating, setCreating] = useState(false);
  const inbox = hydrated ? pending + hot : 0;

  return (
    <div className="flex h-full flex-col px-2.5 pb-2.5 pt-2.5">
      <div className="flex h-11 items-center justify-between pl-2.5">
        <Link href="/" className="text-[18px]" aria-label="Z80.si home">
          <Wordmark />
        </Link>
        {onCollapse && (
          <IconButton label="Close sidebar" onClick={onCollapse}>
            <PanelLeft size={18} />
          </IconButton>
        )}
        {onClose && (
          <IconButton label="Close menu" onClick={onClose}>
            <X size={18} />
          </IconButton>
        )}
      </div>

      <nav aria-label="Main" className="mt-3 space-y-0.5">
        <button onClick={start} className="flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-[14.5px] font-medium text-white transition-colors hover:bg-white/[0.06]">
          <SquarePen size={17} />
          New agent
        </button>
        <SideLink href="/live" label="Inbox" icon={<Inbox size={17} />} active={isActive(path, "/live") || isActive(path, "/approvals")} badge={inbox || undefined} />
        <SideLink href="/routines" label="Routines" icon={<Repeat size={17} />} active={isActive(path, "/routines")} />
        <button onClick={openCommandPalette} className="flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-[14.5px] text-fg-1 transition-colors hover:bg-white/[0.06]">
          <Search size={17} />
          Search
          <span className="ml-auto text-[12px] text-fg-4">⌘K</span>
        </button>
      </nav>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="px-2.5 pb-1.5 text-[12.5px] font-medium text-fg-3">Your agents</div>
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {agents.map((a) => (
            <li key={a.id}>
              <AgentLink agent={a} active={isActive(path, `/team/${a.slug}`)} />
            </li>
          ))}
          <li>
            <button onClick={() => setCreating(true)} className="flex h-10 w-full items-center gap-3 rounded-[10px] px-2.5 text-[14px] text-fg-3 transition-colors hover:bg-white/[0.06] hover:text-fg-1">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-[var(--color-line-3)]">
                <Plus size={13} />
              </span>
              Create your own
            </button>
          </li>
        </ul>
      </div>

      <ProfileMenu />
      <CreateBotDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function SideLink({ href, label, icon, active, badge }: { href: string; label: string; icon: React.ReactNode; active: boolean; badge?: number }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn("flex h-10 items-center gap-3 rounded-[10px] px-2.5 text-[14.5px] transition-colors", active ? "bg-white/[0.08] text-white" : "text-fg-1 hover:bg-white/[0.06]")}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff6f91] px-1.5 text-[11.5px] font-semibold tabular-nums text-[#fff]">{badge}</span>}
    </Link>
  );
}

/** An agent in the sidebar, like a chat in a chat list: name and what it's doing. */
function AgentLink({ agent, active }: { agent: Agent; active: boolean }) {
  const beat = useBeats((b) => b.latest[agent.id]);
  const paused = useWorkspace((s) => s.pausedAgents.includes(agent.id));
  const nick = useWorkspace((s) => s.nicknames[agent.id]);
  return (
    <Link
      href={`/team/${agent.slug}`}
      aria-current={active ? "page" : undefined}
      className={cn("group flex items-center gap-3 rounded-[10px] px-2.5 py-2 transition-colors", active ? "bg-white/[0.08]" : "hover:bg-white/[0.06]")}
    >
      <AgentGlyph agent={agent} size={24} animated={false} muted={paused} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] text-white">{nick ?? agent.name}</span>
        <span className="block truncate text-[12px] text-fg-3">{paused ? "Paused" : beat?.text ?? "Working"}</span>
      </span>
    </Link>
  );
}

function ProfileMenu() {
  const path = usePathname();
  const org = useWorkspace((s) => s.org);
  const hydrated = useWorkspace((s) => s.hydrated);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative mt-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 bottom-[calc(100%+6px)] z-10 rounded-[16px] bg-[var(--surface-raised)] p-1.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.5)] ring-1 ring-[var(--color-line-2)]"
            role="menu"
          >
            {MENU.map((m) => (
              <Link key={m.href} href={m.href} role="menuitem" className="flex h-9 items-center gap-3 rounded-[10px] px-2.5 text-[14px] text-fg-1 hover:bg-white/[0.06]">
                <m.icon size={16} className="text-fg-3" />
                {m.label}
              </Link>
            ))}
            <div className="mx-2.5 my-1.5 h-px bg-[var(--color-line)]" />
            <div className="px-1 pb-1">
              <ThemeSwitch />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4b56ff] to-[#b64cf0] text-[13px] font-semibold text-[#fff]">
          {(org?.name ?? "Z").slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] text-white">{hydrated ? org?.name ?? "Your company" : ""}</span>
          <span className="block text-[12px] text-fg-3">Demo workspace</span>
        </span>
        <ChevronsUpDown size={15} className="text-fg-3" />
      </button>
    </div>
  );
}

/** Contextual loading, never a generic spinner. */
export function AssemblingContext({ text = "Waking up your agents…" }: { text?: string }) {
  return (
    <div className="flex min-h-[70vh] flex-1 items-center justify-center" role="status" aria-live="polite">
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
        <span className="text-[14px] text-fg-3">{text}</span>
      </div>
    </div>
  );
}
