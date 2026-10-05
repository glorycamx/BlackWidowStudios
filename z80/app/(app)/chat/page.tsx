import type { Metadata } from "next";
import { Suspense } from "react";
import { CommandView } from "@/components/command/CommandView";

export const metadata: Metadata = { title: "Command" };

export default function CommandPage() {
  return (
    <Suspense>
      <CommandView />
    </Suspense>
  );
}
