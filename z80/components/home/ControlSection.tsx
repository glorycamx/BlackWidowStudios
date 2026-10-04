"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { Display, Reveal, Section } from "@/components/home/Section";
import { PermissionSwitch } from "@/components/app/PermissionSwitch";
import { defaultPermissions, permissionLevels } from "@/data/permissions";
import { EASE } from "@/lib/motion";
import type { PermissionLevel } from "@/types";

/** STATE 05 — control without micromanagement. Fully interactive. */
export function ControlSection() {
  const [rules, setRules] = useState(defaultPermissions);
  const set = (id: string, level: PermissionLevel) => setRules((r) => r.map((x) => (x.id === id ? { ...x, level } : x)));

  return (
    <Section id="control" index="06" label="Control" className="py-[16vh]">
      <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-20">
        <div>
          <Display lines={["You set", "the mission.", "Z80 runs the", "operation."]} className="text-[clamp(40px,5.6vw,92px)]" />
          <Reveal delay={0.1}>
            <div className="mt-10 grid max-w-[460px] gap-5">
              {permissionLevels.map((l) => (
                <div key={l.id} className="flex gap-4">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: l.id === "autonomous" ? "var(--color-run)" : l.id === "approval" ? "var(--color-attn)" : "#3d3d45", boxShadow: l.id === "disabled" ? "none" : `0 0 10px ${l.id === "autonomous" ? "#6e9bff" : "#d77bff"}` }}
                  />
                  <div>
                    <div className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white">{l.label}</div>
                    <div className="mt-1 text-[14.5px] text-fg-2">{l.summary}</div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.05}>
          <div className="panel-solid p-2">
            <div className="flex items-center justify-between px-4 pb-3 pt-3">
              <span className="label text-[10px]">Workspace permissions</span>
              <span className="label text-[10px]">Try it</span>
            </div>
            <ul>
              {rules.map((r, i) => (
                <motion.li
                  key={r.id}
                  className="flex flex-col gap-3 rounded-[12px] px-4 py-3.5 transition-colors hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: EASE }}
                >
                  <div className="min-w-0">
                    <div className="text-[14.5px] text-white">{r.action}</div>
                    <div className="mt-0.5 text-[12.5px] text-fg-3">{r.detail}</div>
                  </div>
                  <PermissionSwitch value={r.level} onChange={(l) => set(r.id, l)} label={r.action} />
                </motion.li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
