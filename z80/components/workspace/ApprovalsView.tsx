"use client";

import { AnimatePresence, motion } from "motion/react";
import { ApprovalCard } from "@/components/app/ApprovalCard";
import { EmptyState, PageHeader, PageWrap } from "@/components/app/primitives";
import { useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";

export function ApprovalsView() {
  const approvals = useWorkspace((s) => s.approvals);
  const all = Object.values(approvals).sort((a, b) => b.createdAt - a.createdAt);
  const pending = all.filter((a) => a.status === "pending");
  const resolved = all.filter((a) => a.status !== "pending").slice(0, 20);

  return (
    <PageWrap className="max-w-[920px]">
      <PageHeader
        label={pending.length ? `${pending.length} waiting on you` : "All clear"}
        title="Approvals"
        sub="Your intelligences work autonomously within the permissions you set. Anything else waits here for a human decision."
      />
      <div className="mt-12 space-y-3">
        <AnimatePresence initial={false}>
          {pending.map((a) => (
            <motion.div key={a.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.4, ease: EASE }}>
              <ApprovalCard approvalId={a.id} />
            </motion.div>
          ))}
        </AnimatePresence>
        {pending.length === 0 && <EmptyState title="Nothing needs you." body="Your workforce will bring you anything that requires a decision." action={{ label: "Open command", href: "/command" }} />}
      </div>
      {resolved.length > 0 && (
        <section className="mt-16">
          <h2 className="label">Decided</h2>
          <div className="mt-5 space-y-3">
            {resolved.map((a) => (
              <ApprovalCard key={a.id} approvalId={a.id} compact />
            ))}
          </div>
        </section>
      )}
    </PageWrap>
  );
}
