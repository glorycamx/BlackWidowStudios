import type { Skill } from "@/types";

/** What each bot already knows how to do on day one. Owners add more with "Teach it". */
const BUILT_IN: [string, string, string][] = [
  ["manager", "Morning text", "Three lines, most important first. Never more than one screen."],
  ["manager", "Quiet hours", "Holds anything that isn't hot between 10 PM and 6 AM."],
  ["manager", "Who gets what", "Leads go to Lead Hunter, posts to Content Creator, market questions to Researcher."],
  ["lead-hunter", "Owner lookup", "Finds the owner's name from the business filing and their public profile."],
  ["lead-hunter", "Lead score", "Hot if the problem is costing them customers this week."],
  ["lead-hunter", "Double-check", "Confirms an outage twice, five minutes apart, before calling it a lead."],
  ["content-creator", "Your voice", "Short sentences, friendly, no hype. Learned from your past posts."],
  ["content-creator", "Opener formula", "Name the problem, offer one fix, ask one easy question."],
  ["content-creator", "Best times", "Posts when your audience is up: early morning and after dinner."],
  ["researcher", "Upsell match", "Matches each client's gaps to an offer you already sell."],
  ["researcher", "Price watch", "Checks competitor pricing pages and saves a copy when they change."],
  ["reporter", "So what", "Every story ends with why it matters to you and one thing to do."],
  ["reporter", "Skip the noise", "Ignores funding news and launches that don't touch your clients."],
];

export function seedSkills(now: number): Skill[] {
  return BUILT_IN.map(([botId, name, how], i) => ({ id: `sk-${i}`, botId, name, how, learned: "built-in", createdAt: now - 30 * 86400e3 }));
}
