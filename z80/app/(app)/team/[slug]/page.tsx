import type { Metadata } from "next";
import { Suspense } from "react";
import { AgentWorkspace } from "@/components/workforce/AgentWorkspace";
import { agents, getAgentBySlug } from "@/data/bots";

export function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: getAgentBySlug(slug)?.name ?? "Bot" };
}

export default async function AgentWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <Suspense>
      <AgentWorkspace slug={slug} />
    </Suspense>
  );
}
