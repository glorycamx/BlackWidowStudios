"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Command,
  Home,
  MessageSquare,
  Plug,
  Plus,
  Radar,
  Search,
  Settings,
  Users,
  Volume2,
} from "lucide-react";
import { availableAgents } from "@/data/agents";
import { selectMissions, useWorkspace, workspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";
import { cn, missionCode } from "@/lib/utils";

interface Item {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ReactNode;
  run: () => void;
}

export const PALETTE_EVENT = "z80:palette";

export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT));
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const missions = useWorkspace(selectMissions);
  const sound = useWorkspace((s) => s.settings.sound);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(0);
    requestAnimationFrame(() => restoreFocus.current?.focus?.());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        restoreFocus.current = document.activeElement as HTMLElement;
        setOpen((o) => !o);
      }
    };
    const onOpen = () => {
      restoreFocus.current = document.activeElement as HTMLElement;
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const go = useCallback(
    (href: string) => () => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const items = useMemo<Item[]>(() => {
    const base: Item[] = [
      { id: "new", label: "New mission", hint: "Describe an outcome", group: "Command", icon: <Plus size={15} />, run: go("/command?focus=1") },
      { id: "signals", label: "Open signals", hint: "Hot leads and briefings", group: "Navigate", icon: <Radar size={15} />, run: go("/signals") },
      { id: "workforce", label: "Open workforce", group: "Navigate", icon: <Users size={15} />, run: go("/workforce") },
      { id: "approvals", label: "View approvals", group: "Navigate", icon: <CheckCircle2 size={15} />, run: go("/approvals") },
      { id: "missions", label: "Search missions", group: "Navigate", icon: <Search size={15} />, run: go("/missions") },
      ...availableAgents.map((a) => ({
        id: `msg-${a.id}`,
        label: `Message ${a.name}`,
        hint: a.role,
        group: "Intelligences",
        icon: <MessageSquare size={15} style={{ color: a.accent.hex }} />,
        run: go(`/workforce/${a.slug}?message=1`),
      })),
      { id: "connections", label: "Connections", group: "Navigate", icon: <Plug size={15} />, run: go("/connections") },
      { id: "memory", label: "Organization memory", group: "Navigate", icon: <Brain size={15} />, run: go("/memory") },
      { id: "activity", label: "Activity", group: "Navigate", icon: <Activity size={15} />, run: go("/activity") },
      { id: "settings", label: "Settings", group: "Navigate", icon: <Settings size={15} />, run: go("/settings") },
      { id: "home", label: "Z80.si home", group: "Navigate", icon: <Home size={15} />, run: go("/") },
      {
        id: "sound",
        label: sound ? "Turn interface sound off" : "Turn interface sound on",
        group: "Preferences",
        icon: <Volume2 size={15} />,
        run: () => {
          workspace.setSettings({ sound: !sound });
          close();
        },
      },
    ];
    const ms: Item[] = missions.slice(0, 12).map((m) => ({
      id: `mission-${m.id}`,
      label: m.title,
      hint: `Mission ${missionCode(m.number)}`,
      group: "Missions",
      icon: <ArrowRight size={15} />,
      run: go(`/missions/${m.id}`),
    }));
    const all = [...base, ...ms];
    const query = q.trim().toLowerCase();
    if (!query) return all.filter((i) => i.group !== "Missions").concat(ms.slice(0, 3));
    return all.filter((i) => `${i.label} ${i.hint ?? ""} ${i.group}`.toLowerCase().includes(query));
  }, [q, missions, go, sound, close]);

  useEffect(() => setActive(0), [q]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(items.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      items[active]?.run();
    } else if (e.key === "Tab") {
      e.preventDefault();
    }
  };

  useEffect(() => {
    document.getElementById(`cp-${items[active]?.id}`)?.scrollIntoView({ block: "nearest" });
  }, [active, items]);

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button aria-label="Close command palette" className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm" onClick={close} tabIndex={-1} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="panel-solid relative w-full max-w-[600px] overflow-hidden"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.28, ease: EASE }}
            onKeyDown={onKeyDown}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo/70 to-transparent" />
            <div className="flex items-center gap-3 border-b border-line px-5">
              <Command size={15} className="text-fg-3" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command or search…"
                className="h-14 flex-1 bg-transparent text-[15px] text-white placeholder:text-fg-3 focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="cp-list"
                aria-activedescendant={items[active] ? `cp-${items[active].id}` : undefined}
                aria-autocomplete="list"
              />
              <span className="label">esc</span>
            </div>
            <ul id="cp-list" role="listbox" className="max-h-[52vh] overflow-y-auto p-2">
              {items.length === 0 && <li className="px-3 py-8 text-center text-sm text-fg-3">No commands match “{q}”.</li>}
              {items.map((item, i) => {
                const header = item.group !== lastGroup ? item.group : null;
                lastGroup = item.group;
                return (
                  <li key={item.id} role="presentation">
                    {header && <div className="label px-3 pb-2 pt-3 text-[10px]">{header}</div>}
                    <div
                      id={`cp-${item.id}`}
                      role="option"
                      aria-selected={i === active}
                      onMouseMove={() => setActive(i)}
                      onClick={item.run}
                      className={cn(
                        "flex h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 text-[14px] transition-colors duration-150",
                        i === active ? "bg-white/[0.06] text-white" : "text-fg-2",
                      )}
                    >
                      <span className={cn("text-fg-3", i === active && "text-fg-1")}>{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.hint && <span className="truncate font-mono text-[11px] text-fg-3">{item.hint}</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="label text-[10px]">Z80 command</span>
              <span className="label text-[10px]">↑↓ navigate · ↵ run</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
