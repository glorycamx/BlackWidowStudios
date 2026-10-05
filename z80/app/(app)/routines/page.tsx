import type { Metadata } from "next";
import { RoutinesView } from "@/components/routines/RoutinesView";

export const metadata: Metadata = { title: "Routines" };

export default function RoutinesPage() {
  return <RoutinesView />;
}
