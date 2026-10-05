import type { Metadata } from "next";
import { ConnectionsView } from "@/components/workspace/ConnectionsView";

export const metadata: Metadata = { title: "Connections" };

export default function Page() {
  return <ConnectionsView />;
}
