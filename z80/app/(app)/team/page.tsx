import type { Metadata } from "next";
import { WorkforceRoster } from "@/components/workforce/WorkforceRoster";

export const metadata: Metadata = { title: "Your team" };

export default function WorkforcePage() {
  return <WorkforceRoster />;
}
