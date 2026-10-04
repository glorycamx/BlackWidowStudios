"use client";

import { useState } from "react";
import { Intro, Reveal, Section } from "@/components/home/Section";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { defaultPermissions } from "@/data/permissions";
import type { PermissionLevel } from "@/types";

const SHOWN = ["research-public", "generate-drafts", "send-email", "spend-budget", "delete-data"];

/** Control without micromanagement. Interactive. */
export function ControlSection() {
  const [rules, setRules] = useState(defaultPermissions.filter((r) => SHOWN.includes(r.id)));
  const set = (id: string, level: PermissionLevel) => setRules((r) => r.map((x) => (x.id === id ? { ...x, level } : x)));

  return (
    <Section id="control" className="py-[18vh]">
      <Intro title={["You set the mission.", "Z80 runs it."]} sub="Choose what happens on its own, and what asks you first." />
      <Reveal delay={0.1}>
        <ul className="mx-auto mt-14 max-w-[640px] divide-y divide-white/[0.06] overflow-hidden rounded-[24px] bg-white/[0.04]">
          {rules.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-[16px] text-white">{r.action}</span>
              <PermissionSwitch value={r.level} onChange={(l) => set(r.id, l)} label={r.action} />
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
