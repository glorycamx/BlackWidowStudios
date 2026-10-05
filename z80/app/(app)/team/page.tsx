import type { Metadata } from "next";
import { Suspense } from "react";
import { WorkforceRoster } from "@/components/workforce/WorkforceRoster";

export const metadata: Metadata = { title: "Your team" };

export default function TeamPage() {
  return (
    <Suspense>
      <WorkforceRoster />
    </Suspense>
  );
}
