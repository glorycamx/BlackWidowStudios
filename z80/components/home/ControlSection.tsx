"use client";

import Link from "next/link";
import { useState } from "react";
import { Intro, Reveal, Section } from "@/components/home/Section";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { defaultPermissions } from "@/data/permissions";
import type { PermissionLevel } from "@/types";

const SHOWN = ["research-public", "generate-drafts", "send-email", "spend-budget", "delete-data"];

const POINTS = [
  { t: "Say yes first", d: "Emails, posts and spend wait for you, unless you turn on “Do it without asking.”" },
  { t: "See every step", d: "Every check, find and action is logged the moment it happens." },
  { t: "Pause anytime", d: "Stop one routine or a whole bot in one tap." },
];

/** You stay the boss: interactive permissions plus the three promises. */
export function ControlSection() {
  const [rules, setRules] = useState(defaultPermissions.filter((r) => SHOWN.includes(r.id)));
  const set = (id: string, level: PermissionLevel) => setRules((r) => r.map((x) => (x.id === id ? { ...x, level } : x)));

  return (
    <Section id="control" className="py-[18vh]">
      <Intro title={["They work on their own.", "You stay the boss."]} sub="Choose what they can do without asking. Everything else waits for your yes." />
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
      <Reveal delay={0.05}>
        <ul className="mx-auto mt-6 grid max-w-[960px] gap-px overflow-hidden rounded-[24px] bg-white/[0.07] sm:grid-cols-3">
          {POINTS.map((p) => (
            <li key={p.t} className="bg-[#050507] px-8 py-9 text-center">
              <div className="text-[19px] font-semibold tracking-[-0.02em] text-white">{p.t}</div>
              <p className="mt-2 text-[15px] leading-snug text-fg-3">{p.d}</p>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={0.1}>
        <p className="mt-10 flex justify-center gap-8 text-[15px]">
          <Link href="/security" className="text-[#9aa5ff] hover:text-white">
            Security ›
          </Link>
          <Link href="/pricing" className="text-[#9aa5ff] hover:text-white">
            Plans ›
          </Link>
        </p>
      </Reveal>
    </Section>
  );
}
