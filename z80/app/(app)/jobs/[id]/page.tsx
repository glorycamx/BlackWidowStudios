import type { Metadata } from "next";
import { Suspense } from "react";
import { MissionView } from "@/components/missions/MissionView";

export const metadata: Metadata = { title: "Job" };

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense>
      <MissionView id={id} />
    </Suspense>
  );
}
