/**
 * BotRuntime: the seam between the app and whatever runs the bots.
 * Today the local simulation implements it (lib/sim + the workspace store).
 * A server can implement the same interface later and stream the same
 * shapes: routines, feed items, heartbeats and team messages.
 */
import { allBots } from "@/data/bots";
import { getWorkspace, workspace } from "@/lib/store/workspace";
import { parseBotSpec, parseRoutine } from "@/lib/sim/parse";
import type { Agent, FeedItem, Routine } from "@/types";

export interface BotRuntime {
  listBots(): Agent[];
  listRoutines(): Routine[];
  /** Plain English in, a running routine out. */
  createRoutine(text: string, botId?: string): Routine;
  /** "A bot that…" in, a bot on shift out. Returns its id. */
  createBot(text: string): string;
  /** New feed items as they arrive. Returns an unsubscribe function. */
  subscribe(onFind: (item: FeedItem) => void): () => void;
  approve(approvalId: string): void;
  reject(approvalId: string): void;
  pauseBot(botId: string): void;
}

export const localRuntime: BotRuntime = {
  listBots: () => allBots(),
  listRoutines: () => getWorkspace().routines,
  createRoutine(text, botId) {
    const p = parseRoutine(text, { botId });
    return workspace.addRoutine(p);
  },
  createBot(text) {
    const b = parseBotSpec(text);
    return workspace.createBot(b);
  },
  subscribe(onFind) {
    let last = getWorkspace().feed[0]?.id;
    const id = setInterval(() => {
      const feed = getWorkspace().feed;
      const fresh: FeedItem[] = [];
      for (const f of feed) {
        if (f.id === last) break;
        fresh.push(f);
      }
      if (fresh.length) {
        last = feed[0].id;
        fresh.reverse().forEach(onFind);
      }
    }, 500);
    return () => clearInterval(id);
  },
  approve: (id) => workspace.resolveApproval(id, "approved"),
  reject: (id) => workspace.resolveApproval(id, "denied"),
  pauseBot: (id) => workspace.togglePauseAgent(id),
};
