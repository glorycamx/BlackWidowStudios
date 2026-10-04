import type { Metadata } from "next";
import { MissionsList } from "@/components/missions/MissionsList";

export const metadata: Metadata = { title: "Missions" };

export default function MissionsPage() {
  return <MissionsList />;
}
