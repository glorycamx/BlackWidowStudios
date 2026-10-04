/**
 * resultsService — MOCK deliverables for completed missions.
 *
 * Everything here is generated, deterministic sample data so the demo has
 * something real-looking to inspect. It is labelled as simulated in the UI.
 * Replace with the outputs returned by real agent runs.
 */
import type { BriefFinding, CampaignConcept, Mission, MissionResults, Prospect } from "@/types";
import { hashString, pick, prng, titleCase } from "@/lib/utils";
import { MAX_PROSPECTS } from "@/lib/services/planService";

const FIRST = ["Dana", "Marcus", "Priya", "Tom", "Elena", "Jordan", "Kevin", "Rosa", "Sam", "Hannah", "Luis", "Grace", "Owen", "Nadia", "Paul", "Tessa", "Victor", "Amy", "Caleb", "Irene"];
const LAST = ["Mercer", "Okafor", "Lindqvist", "Brennan", "Castillo", "Duarte", "Hale", "Ibarra", "Kowalski", "Nguyen", "Ashford", "Pryor", "Sutter", "Wexler", "Yates", "Moreau", "Delgado", "Fischer", "Rourke", "Whitlock"];
const PLACES = ["Granite", "Riverside", "Summit", "Harbor", "Oak Hill", "Northfield", "Cedar", "Lakeview", "Pine Ridge", "Ironwood", "Bayside", "Maple", "Stonegate", "Westbrook", "Highland"];
const INDUSTRIES = ["Roofing", "Plumbing", "HVAC", "Landscaping", "Dental", "Auto Repair", "Electric", "Painting", "Bakery", "Fitness", "Flooring", "Pest Control"];
const AREAS = ["Downtown", "North End", "Westside", "Riverside", "Old Town", "East Hill", "Southgate", "Harbor District"];
const TITLES = ["Owner", "Owner", "Founder", "General Manager", "Co-owner"];

const SIGNALS: { signal: string; opener: (co: string, first: string) => string }[] = [
  { signal: "Site not mobile-friendly", opener: (co, f) => `${f}, I pulled up ${co} on my phone and had to pinch-zoom to find your number. Most of your customers are trying to do exactly that.` },
  { signal: "No online booking", opener: (co, f) => `${f}, ${co}'s reviews keep mentioning how hard it is to get on your schedule. A booking button on the site would fix half of that.` },
  { signal: "Copyright footer from 2017", opener: (co, f) => `${f}, ${co}'s site still says © 2017 at the bottom. Your work has clearly moved on since then. The website hasn't.` },
  { signal: "Load time 6.1s on mobile", opener: (co, f) => `${f}, ${co}'s homepage takes about six seconds to load on a phone. Most visitors leave after three.` },
  { signal: "No reviews shown on site", opener: (co, f) => `${f}, ${co} has dozens of great Google reviews, and none of them appear on your website.` },
  { signal: "Broken contact form", opener: (co, f) => `${f}, I tried the contact form on ${co}'s site and it didn't go through. You may be losing leads right now.` },
];

function industryFrom(target?: string): string | null {
  if (!target) return null;
  const word = target.replace(/\b(companies|businesses|contractors|firms|shops|stores|practices|clinics|owners|operators|accounts|leads|prospects)\b/gi, "").trim();
  if (!word) return null;
  return titleCase(word);
}

export function generateProspects(mission: Mission): Prospect[] {
  const r = prng(hashString(mission.id + mission.objective));
  const n = Math.min(mission.entities.count ?? 50, MAX_PROSPECTS);
  const industry = industryFrom(mission.entities.target);
  const loc = mission.entities.location && mission.entities.location !== "your area" ? mission.entities.location : null;
  const used = new Set<string>();
  const list: Prospect[] = [];
  for (let i = 0; i < n; i++) {
    const ind = industry ?? pick(r, INDUSTRIES);
    let company = "";
    for (let tries = 0; tries < 6; tries++) {
      const pattern = r();
      company =
        pattern < 0.4 ? `${pick(r, PLACES)} ${ind}` : pattern < 0.7 ? `${pick(r, LAST)} ${ind}` : `${pick(r, LAST)} & Sons ${ind}`;
      if (!used.has(company)) break;
    }
    used.add(company);
    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    const s = pick(r, SIGNALS);
    list.push({
      id: `p${i}`,
      company,
      location: loc ? `${pick(r, AREAS)}, ${loc}` : pick(r, AREAS),
      owner: `${first} ${last}`,
      title: pick(r, TITLES),
      signal: s.signal,
      score: Math.round(62 + r() * 36),
      opener: s.opener(company, first),
    });
  }
  return list.sort((a, b) => b.score - a.score);
}

function concepts(): CampaignConcept[] {
  return [
    { id: "a", name: "Proof, not promises", hook: "Real jobs. Real numbers. Real neighbors.", body: "Lead with finished work and customer words. Every asset shows a result someone nearby can verify.", channels: ["Meta Ads", "Email", "Website"] },
    { id: "b", name: "Faster than you'd think", hook: "Booked this week. Done next week.", body: "Own speed — the one thing no competitor claims. Simple, confident, specific timelines.", channels: ["Search", "Email", "Instagram"] },
    { id: "c", name: "Built here", hook: "Your town's crew since day one.", body: "Local pride and accountability. Faces, streets and landmarks people recognize.", channels: ["Instagram", "Direct mail", "Website"] },
  ];
}

function findings(): BriefFinding[] {
  return [
    { id: "1", subject: "Pricing", finding: "4 of 5 competitors hide pricing entirely.", implication: "Publishing starting prices builds trust before the first call." },
    { id: "2", subject: "Response time", finding: "Average quote response across competitors: 2.4 days.", implication: "A same-day quote promise is a defensible differentiator." },
    { id: "3", subject: "Reviews", finding: "Only one competitor shows reviews on their own site.", implication: "Surface reviews on every service page." },
    { id: "4", subject: "Messaging", finding: "Every competitor leads with 'quality' and 'experience'.", implication: "Lead with specifics: timelines, guarantees, named crews." },
  ];
}

export function generateResults(mission: Mission): MissionResults {
  const held = mission.outreachHeld;
  switch (mission.resultKind) {
    case "prospects": {
      const prospects = generateProspects(mission);
      const n = prospects.length;
      const hasOutreach = mission.tasks.some((t) => t.id === "create");
      return {
        kind: "prospects",
        headline: `${n} qualified prospects are ready.`,
        summary: hasOutreach
          ? held
            ? "Outreach is held for your edits. Nothing has been sent."
            : "Your outreach campaign is prepared."
          : "Decision makers and contact paths are attached.",
        prospects,
      };
    }
    case "campaign":
      return {
        kind: "campaign",
        headline: "Your campaign is prepared.",
        summary: held ? "Held for your edits. Nothing has been published." : "3 directions, 12 assets, scheduled for launch.",
        concepts: concepts(),
      };
    case "outreach":
      return {
        kind: "outreach",
        headline: held ? `Outreach to ${mission.lead?.business ?? "the lead"} is on hold.` : `Outreach to ${mission.lead?.business ?? "the lead"} is scheduled.`,
        summary: held ? "Nothing was sent. The draft is saved for your edits." : "First touch goes out tomorrow at 9:00 AM. Follow-up in 3 days.",
        outreach: mission.lead ? { to: mission.lead.owner, business: mission.lead.business, script: mission.lead.script } : undefined,
      };
    case "brief":
      return { kind: "brief", headline: "Your brief is ready.", summary: "5 competitors analyzed. 3 gaps worth acting on.", findings: findings() };
    default:
      return { kind: "generic", headline: "Mission complete.", summary: "Deliverables are organized in the mission." };
  }
}
