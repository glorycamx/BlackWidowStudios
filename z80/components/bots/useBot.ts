"use client";

import { getAgentBySlug, specToAgent, allBots, bots } from "@/data/bots";
import { useWorkspace } from "@/lib/store/workspace";
import type { Agent } from "@/types";

/** Look up a bot by slug, including ones the owner made. */
export function useBot(slug: string): { bot: Agent | undefined; ready: boolean } {
  const custom = useWorkspace((s) => s.customBots);
  const ready = useWorkspace((s) => s.hydrated);
  const bot = getAgentBySlug(slug) ?? custom.map(specToAgent).find((b) => b.slug === slug);
  return { bot, ready };
}

/** Built-in bots plus the owner's own, in roster order. */
export function useRoster(): Agent[] {
  const custom = useWorkspace((s) => s.customBots);
  return [...bots, ...custom.map(specToAgent)];
}

/** Bots that can work (not coming soon), including custom ones. */
export function useWorkingBots(): Agent[] {
  return useRoster().filter((b) => b.availability === "available");
}

/** Nickname if set, otherwise the bot's name. */
export function useBotName(id: string): string {
  const nick = useWorkspace((s) => s.nicknames[id]);
  const custom = useWorkspace((s) => s.customBots.find((b) => b.id === id)?.name);
  return nick ?? custom ?? allBots().find((b) => b.id === id)?.name ?? id;
}
