"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarClock, Target, TrendingUp } from "lucide-react";
import { Composer } from "@/components/chat/Composer";
import { cn } from "@/lib/utils";

const STARTERS = [
  { icon: Target, label: "Find hot leads", prompt: "Every morning, find local businesses whose website just went down" },
  { icon: CalendarClock, label: "Post for me", prompt: "Keep my social posts going out every weekday at 8 AM" },
  { icon: TrendingUp, label: "Watch competitors", prompt: "Watch my competitors' prices and tell me when they change" },
];

/** The homepage message box: type a job, land in the app with it ready to deploy. */
export function HomeComposer({ id = "home-composer", className, starters = true }: { id?: string; className?: string; starters?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const go = (t: string) => router.push(`/chat?prompt=${encodeURIComponent(t)}`);
  return (
    <div className={cn("w-full", className)}>
      <Composer id={id} size="lg" value={value} onChange={setValue} onSubmit={go} label="What should your first agent do?" placeholder="What should your first agent do?" />
      {starters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {STARTERS.map((s) => (
            <button key={s.label} onClick={() => go(s.prompt)} className="inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-[13.5px] text-fg-1 ring-1 ring-[var(--color-line-2)] transition-colors hover:bg-white/[0.06]">
              <s.icon size={14} className="text-fg-3" />
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
