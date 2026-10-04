"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Mic, MicOff, Paperclip, Plug, X } from "lucide-react";
import { integrations, integrationStatusLabel } from "@/data/integrations";
import { EASE } from "@/lib/motion";
import { clamp, cn } from "@/lib/utils";

export const MISSION_EXAMPLES = [
  "Build me a sales pipeline.",
  "Launch our next campaign.",
  "Find companies that need our service.",
  "Run our content operation.",
  "Research my competitors.",
  "Recover our cold leads.",
  "Prepare tomorrow's sales calls.",
];

export interface CommandConsoleHandle {
  focus(): void;
}

interface Props {
  value: string;
  onChange(value: string): void;
  onSubmit(value: string): void;
  examples?: string[];
  size?: "hero" | "final" | "compact";
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
  id?: string;
}

type SpeechRec = {
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  interimResults: boolean;
  continuous: boolean;
};

function getSpeech(): (new () => SpeechRec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * The Z80 command console. Not a chat box: a mission input whose border
 * charges with energy as the objective takes shape.
 */
export const CommandConsole = forwardRef<CommandConsoleHandle, Props>(function CommandConsole(
  { value, onChange, onSubmit, examples = MISSION_EXAMPLES, size = "hero", disabled, label = "Mission", hint = "Tell Z80 what outcome you need.", className, id = "mission-input" },
  ref,
) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<SpeechRec | null>(null);
  const [focused, setFocused] = useState(false);
  const [ex, setEx] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [tools, setTools] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => taRef.current?.focus() }), []);

  useEffect(() => {
    if (value) return;
    const t = setInterval(() => setEx((i) => (i + 1) % examples.length), 3400);
    return () => clearInterval(t);
  }, [value, examples.length]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, size === "compact" ? 160 : 220)}px`;
  }, [value, size]);

  useEffect(() => {
    if (!note) return;
    const t = setTimeout(() => setNote(null), 2800);
    return () => clearTimeout(t);
  }, [note]);

  useEffect(() => () => recRef.current?.stop(), []);

  const energy = clamp(value.trim().length / 70);
  const charged = focused || value.length > 0;
  const canSubmit = value.trim().length > 2 && !disabled;

  const submit = () => {
    if (canSubmit) onSubmit(value.trim());
  };

  const toggleMic = () => {
    const SR = getSpeech();
    if (!SR) {
      setNote("Voice input isn't available in this browser.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.interimResults = true;
    rec.continuous = false;
    const before = value;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onChange(`${before}${before && !before.endsWith(" ") ? " " : ""}${text}`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setNote("Couldn't hear that. Check microphone permissions.");
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const textSize = size === "compact" ? "text-[15px] leading-[1.55]" : size === "final" ? "text-[18px] md:text-[21px] leading-[1.45]" : "text-[17px] md:text-[19px] leading-[1.5]";

  return (
    <div className={cn("relative", className)}>
      {/* Charge glow under the console */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-8 -bottom-10 top-1/2 rounded-[40px] blur-3xl transition-opacity duration-700"
        style={{
          opacity: charged ? 0.25 + energy * 0.55 : 0,
          background: "radial-gradient(60% 60% at 50% 50%, rgba(100,91,255,0.55), rgba(69,108,255,0.2) 45%, transparent 75%)",
        }}
      />
      <div
        className={cn(
          "relative overflow-hidden rounded-[18px] bg-[#060609]/90 backdrop-blur-md transition-shadow duration-500",
          size === "compact" && "rounded-[16px]",
        )}
        style={{
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,${charged ? 0.1 : 0.08}), inset 0 1px 0 rgba(255,255,255,0.06), 0 40px 100px -30px rgba(0,0,0,0.9)`,
        }}
      >
        {/* Energy border: brightens with the objective */}
        <div
          aria-hidden
          className="energy-border pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-500"
          style={{ opacity: charged ? 0.25 + energy * 0.75 : 0 }}
        />
        {/* Top scan line */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden">
          <div
            className="h-px bg-gradient-to-r from-transparent via-[#8f9cff] to-transparent transition-[width,opacity] duration-700 ease-[var(--ease-z)]"
            style={{ width: `${20 + energy * 80}%`, opacity: charged ? 0.9 : 0.25, marginLeft: `${(100 - (20 + energy * 80)) / 2}%` }}
          />
        </div>

        <div className={cn("flex items-center justify-between px-5 pt-4", size === "compact" && "px-4 pt-3")}>
          <label htmlFor={id} className="label flex items-center gap-2 text-fg-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className={cn("absolute inset-0 rounded-full bg-indigo", charged && "motion-safe:animate-breathe")} />
            </span>
            {label}
          </label>
          <span className="label hidden text-[10px] sm:inline">{value ? "↵ deploy · ⇧↵ new line" : hint}</span>
        </div>

        <div className={cn("relative px-5 pb-2 pt-2.5", size === "compact" && "px-4")}>
          <textarea
            ref={taRef}
            id={id}
            rows={size === "compact" ? 1 : 2}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            aria-describedby={`${id}-hint`}
            className={cn("block w-full resize-none bg-transparent text-white caret-[#9aa5ff] placeholder:text-transparent focus:outline-none", textSize)}
            placeholder={examples[ex]}
          />
          <span id={`${id}-hint`} className="sr-only">
            {hint} Press Enter to submit, Shift and Enter for a new line.
          </span>
          <AnimatePresence mode="wait">
            {!value && (
              <motion.span
                key={ex}
                aria-hidden
                className={cn("pointer-events-none absolute left-5 top-2.5 text-fg-3", textSize, size === "compact" && "left-4")}
                initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                transition={{ duration: 0.5, ease: EASE }}
              >
                {examples[ex]}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 px-5 pb-1">
            {files.map((f) => (
              <span key={f} className="flex h-7 items-center gap-2 rounded-[8px] bg-white/[0.04] pl-2.5 pr-1.5 font-mono text-[11px] text-fg-2 hairline">
                {f}
                <button aria-label={`Remove ${f}`} onClick={() => setFiles((fs) => fs.filter((x) => x !== f))} className="text-fg-3 hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className={cn("flex items-center justify-between gap-2 px-3 pb-3", size === "compact" && "pb-2.5")}>
          <div className="flex items-center gap-0.5">
            <ToolButton label="Attach files" onClick={() => fileRef.current?.click()}>
              <Paperclip size={15} />
            </ToolButton>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const names = Array.from(e.target.files ?? []).map((f) => f.name);
                setFiles((fs) => [...new Set([...fs, ...names])]);
                if (names.length) setNote("Files stay on your device in this demo.");
                e.target.value = "";
              }}
            />
            <ToolButton label={listening ? "Stop dictation" : "Dictate"} onClick={toggleMic} active={listening}>
              {listening ? <MicOff size={15} /> : <Mic size={15} />}
            </ToolButton>
            <div className="relative">
              <ToolButton label="Connections" onClick={() => setTools((t) => !t)} active={tools} expanded={tools}>
                <Plug size={15} />
              </ToolButton>
              <AnimatePresence>
                {tools && (
                  <motion.div
                    className="panel-solid absolute bottom-11 left-0 z-20 w-[280px] p-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.2 }}
                    onKeyDown={(e) => e.key === "Escape" && setTools(false)}
                  >
                    <div className="label px-2 pb-2 pt-1.5 text-[10px]">Connections</div>
                    <ul className="max-h-56 overflow-y-auto">
                      {integrations.slice(0, 8).map((i) => (
                        <li key={i.id} className="flex items-center justify-between rounded-md px-2 py-1.5 text-[13px] text-fg-2">
                          <span className="flex items-center gap-2.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-[6px] font-mono text-[9px] text-fg-1 hairline">{i.mono}</span>
                            {i.name}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-fg-3">{integrationStatusLabel[i.status]}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href="/connections" className="mt-1 block rounded-md px-2 py-2 text-[12px] text-fg-1 hover:bg-white/5">
                      Manage connections →
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <AnimatePresence>
              {note && (
                <motion.span
                  role="status"
                  className="ml-2 hidden text-[12px] text-fg-3 sm:inline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {note}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <SubmitButton enabled={canSubmit} onClick={submit} energy={energy} />
        </div>
      </div>
    </div>
  );
});

function ToolButton({ children, label, onClick, active, expanded }: { children: React.ReactNode; label: string; onClick(): void; active?: boolean; expanded?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-[10px] text-fg-3 transition-colors duration-150 hover:bg-white/[0.05] hover:text-fg-1",
        active && "bg-white/[0.06] text-white",
      )}
    >
      {children}
    </button>
  );
}

function SubmitButton({ enabled, onClick, energy }: { enabled: boolean; onClick(): void; energy: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      aria-label="Submit mission"
      className={cn(
        "group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[11px] transition-all duration-300 ease-[var(--ease-z)]",
        enabled ? "bg-white text-black shadow-[0_0_28px_-4px_rgba(130,120,255,0.8)]" : "bg-white/[0.06] text-fg-3",
      )}
      style={{ opacity: enabled ? 1 : 0.6 + energy * 0.4 }}
    >
      {enabled && (
        <span aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(100,91,255,0.55),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="relative transition-transform duration-300 ease-[var(--ease-z)] group-hover:-translate-y-0.5">
        <path d="M8 13V3.5M8 3.5L3.5 8M8 3.5L12.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="8" cy="14.2" r="0.9" fill="currentColor" opacity="0.6" />
      </svg>
    </button>
  );
}
