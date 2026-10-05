/**
 * Shared user-facing words. The vocabulary is plain English on purpose:
 * bots, routines, jobs, apps. Keep labels here so they stay consistent.
 */
export const NAV_LABELS = {
  live: "Live",
  chat: "Chat",
  team: "Your team",
  routines: "Routines",
  calendar: "Content calendar",
  jobs: "Jobs",
  approvals: "Needs you",
  activity: "Activity",
  memory: "Memory",
  apps: "Apps",
  settings: "Settings",
} as const;

export const COPY = {
  oneLiner: "Your AI bots never clock out.",
  brandLine: "Super intelligence is here.",
  support:
    "Chatbots wait for you to ask. Z80 bots find leads, post your content, and watch your market around the clock, then text you when something needs a yes.",
  buildYourOwn: "Or build your own bot in a sentence.",
  doWithoutAsking: "Do it without asking",
  doWithoutAskingHelp: "Lets this routine send or post on its own. Off means it waits for your yes.",
} as const;

/** Job numbers read as "Job 248". */
export function jobLabel(n: number): string {
  return `Job ${n}`;
}
