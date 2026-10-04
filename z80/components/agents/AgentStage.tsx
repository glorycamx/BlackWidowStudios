"use client";

import { useMemo } from "react";
import { IntelligenceCanvas } from "@/components/three/IntelligenceCanvas";
import { createDirector, FORMS } from "@/lib/scene/director";
import type { AgentVisual } from "@/types";

const FORM_FOR: Record<AgentVisual, keyof typeof FORMS> = {
  lattice: "lattice",
  scanner: "scanner",
  fluid: "fluid",
  orbit: "sphere",
};

/** A contained particle stage showing one intelligence's signature form. */
export function AgentStage({ visual }: { visual: AgentVisual }) {
  const director = useMemo(() => createDirector({ weights: FORMS[FORM_FOR[visual]], offset: [-0.08, 0], scale: visual === "scanner" ? 0.62 : 0.66, lines: visual === "orbit" ? 1 : 0 }), [visual]);
  return <IntelligenceCanvas director={director} />;
}
