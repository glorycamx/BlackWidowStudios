import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AgentProfile } from "@/components/agents/AgentProfile";
import { Footer } from "@/components/z80/Footer";
import { agents, getAgentBySlug } from "@/data/agents";

export function generateStaticParams() {
  return agents.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = getAgentBySlug(slug);
  if (!a) return {};
  return { title: `${a.name} — ${a.role}`, description: `${a.tagline} ${a.shortDescription}` };
}

export default async function AgentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = getAgentBySlug(slug);
  if (!agent) notFound();
  return (
    <>
      <AgentProfile agent={agent} />
      <Footer />
    </>
  );
}
