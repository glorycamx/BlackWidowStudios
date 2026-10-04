"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { TeamAssembly } from "@/components/command/TeamAssembly";
import { useWorkspace } from "@/lib/store/workspace";
import { EASE } from "@/lib/motion";

/** Review a plan spatially, edit the team, deploy. */
export function PlanDialog({ planId, onClose, onDeployed }: { planId: string | null; onClose(): void; onDeployed?(missionId: string): void }) {
  const plan = useWorkspace((s) => (planId ? s.plans[planId] : undefined));

  useEffect(() => {
    if (!planId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [planId, onClose]);

  return (
    <AnimatePresence>
      {planId && plan && (
        <motion.div className="fixed inset-0 z-[70] overflow-y-auto bg-black/85 backdrop-blur-xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Review plan"
            className="mx-auto w-full max-w-[1240px] px-5 py-10 md:px-10 md:py-16"
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <TeamAssembly
              plan={plan}
              onBack={onClose}
              backLabel="Close"
              onDeployed={(id) => {
                onClose();
                onDeployed?.(id);
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
