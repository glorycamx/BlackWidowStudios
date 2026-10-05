"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Panel } from "@/components/app/primitives";
import { useWorkspace, workspace } from "@/lib/store/workspace";

const LEARNED = { "built-in": "Built in", taught: "You taught it", edits: "Learned from your edits" } as const;

/** What a bot knows how to do, plus "Teach it". */
export function SkillsPanel({ botId, name, className }: { botId: string; name: string; className?: string }) {
  const skills = useWorkspace((s) => s.skills.filter((k) => k.botId === botId));
  const [open, setOpen] = useState(false);
  const [skill, setSkill] = useState("");
  const [how, setHow] = useState("");
  return (
    <Panel
      title="Skills"
      className={className}
      action={
        <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-1 text-[12px] text-fg-3 hover:text-white" aria-expanded={open}>
          <Plus size={12} /> Teach it
        </button>
      }
    >
      {open && (
        <form
          className="mb-5 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            workspace.teachSkill(botId, skill, how);
            setSkill("");
            setHow("");
            setOpen(false);
          }}
        >
          <input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Name it, e.g. Never call before 9 AM" aria-label="Skill name" className="w-full rounded-[10px] bg-white/[0.04] px-3 py-2 text-[14px] text-white placeholder:text-fg-4 hairline focus:outline-none" />
          <input value={how} onChange={(e) => setHow(e.target.value)} placeholder={`How should ${name} do it?`} aria-label="How" className="w-full rounded-[10px] bg-white/[0.04] px-3 py-2 text-[14px] text-white placeholder:text-fg-4 hairline focus:outline-none" />
          <button type="submit" disabled={!skill.trim()} className="h-8 rounded-full bg-white px-4 text-[13px] font-medium text-black disabled:opacity-30">
            Teach {name}
          </button>
        </form>
      )}
      {skills.length === 0 ? (
        <p className="text-[14px] text-fg-3">Nothing yet. Teach it how you like things done.</p>
      ) : (
        <ul className="space-y-3.5">
          {skills.map((k) => (
            <li key={k.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-[14px] text-white">{k.name}</span>
                <span className="shrink-0 text-[12px] text-fg-4">{LEARNED[k.learned]}</span>
              </div>
              <p className="mt-0.5 text-[13px] leading-snug text-fg-3">{k.how}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
