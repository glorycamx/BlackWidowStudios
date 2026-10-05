/**
 * signalService: the lead and news pools behind the bots' finds.
 *
 * MOCK GENERATOR. Produces realistic, deterministic sample signals so the
 * demo has a live feed. Every business, contact and headline here is
 * generated sample data (phone numbers use the reserved 555-01xx range and
 * sites use the reserved .example domain). A real deployment replaces
 * the generators in lib/sim with live monitors that emit the same FeedItem shape.
 */
import type { LeadDossier, LeadTemperature } from "@/types";
import { pick } from "@/lib/utils";

const FIRST = ["Dana", "Marcus", "Priya", "Tom", "Elena", "Jordan", "Kevin", "Rosa", "Sam", "Hannah", "Luis", "Grace", "Owen", "Nadia", "Paul", "Tessa", "Victor", "Amy", "Caleb", "Irene"];
const LAST = ["Mercer", "Okafor", "Lindqvist", "Brennan", "Castillo", "Duarte", "Hale", "Ibarra", "Kowalski", "Nguyen", "Ashford", "Pryor", "Sutter", "Wexler", "Yates", "Moreau", "Delgado", "Fischer", "Rourke", "Whitlock"];
const PLACES = ["Granite", "Riverside", "Summit", "Harbor", "Oak Hill", "Northfield", "Cedar", "Lakeview", "Pine Ridge", "Ironwood", "Bayside", "Maple", "Stonegate", "Westbrook", "Highland"];
const TOWNS = ["Manchester, NH", "Nashua, NH", "Concord, NH", "Portsmouth, NH", "Dover, NH", "Keene, NH", "Salem, NH", "Derry, NH", "Bedford, NH", "Exeter, NH"];
const WEB_INDUSTRIES = ["Roofing", "Plumbing", "HVAC", "Landscaping", "Auto Repair", "Electric", "Painting", "Bakery", "Fitness", "Flooring", "Pest Control", "Tree Service"];
const AI_INDUSTRIES = ["Dental", "Property Management", "Law Office", "HVAC", "Med Spa", "Insurance Agency", "Veterinary Clinic", "Physical Therapy"];

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "");
}

function person(r: () => number) {
  return { first: pick(r, FIRST), last: pick(r, LAST) };
}

function businessName(r: () => number, industry: string) {
  const p = r();
  if (p < 0.4) return `${pick(r, PLACES)} ${industry}`;
  if (p < 0.75) return `${pick(r, LAST)} ${industry}`;
  return `${pick(r, LAST)} & Sons ${industry}`;
}

function contact(r: () => number, business: string, first: string) {
  const domain = `${slugify(business)}.example`;
  return {
    phone: `(603) 555-01${String(Math.floor(r() * 90) + 10)}`,
    email: `${first.toLowerCase()}@${domain}`,
    domain,
  };
}

function priorityFor(t: LeadTemperature): 1 | 2 | 3 {
  return t === "hot" ? 1 : t === "warm" ? 2 : 3;
}

/* ------------------------------------------------------------------ */
/* Website opportunities                                               */
/* ------------------------------------------------------------------ */

type WebTrigger = { trigger: string; temp: LeadTemperature; headline: (b: string) => string; problems: string[]; angle: string; opener: (f: string, b: string) => string };

const WEB_TRIGGERS: WebTrigger[] = [
  {
    trigger: "Website went down",
    temp: "hot",
    headline: () => "Site went offline. Visitors see an error page",
    problems: ["Site offline right now", "No uptime monitoring", "Contact form unreachable while down", "Built on an unsupported theme"],
    angle: "Show their site back up on a fast, monitored build, with a 60-second before/after video.",
    opener: (f, b) => `${f}, heads up: ${b}'s website is down right now, so anyone searching for you right now hits an error page. We can get you back online today on a faster site that tells us before it ever goes down again. Want me to send a quick preview?`,
  },
  {
    trigger: "Business changed hands",
    temp: "hot",
    headline: () => "New owner; website still shows the previous owner",
    problems: ["Site still lists previous owner and phone", "Branding from 2016", "No online booking", "Not mobile-friendly"],
    angle: "A fresh site that introduces the new owner, built in their first 30 days.",
    opener: (f, b) => `${f}, congratulations on taking over ${b}. Your website still introduces the previous owner and their phone number, which is confusing new customers. We help new owners relaunch in their first month. Can I show you a quick mockup with your name on it?`,
  },
  {
    trigger: "New business registered",
    temp: "hot",
    headline: () => "Just registered; Google profile but no website",
    problems: ["No website yet", "Google profile has no link", "Competitors rank above them", "No way to request a quote online"],
    angle: "A launch-ready site in a week, linked to their Google profile so calls start now.",
    opener: (f, b) => `${f}, congrats on opening ${b}. Right now your Google listing doesn't link to a website, so people who find you can't see your work or request a quote. We launch new businesses in about a week. Want to see what yours could look like?`,
  },
  {
    trigger: "Review surge",
    temp: "warm",
    headline: () => "14 new five-star reviews this month, none on their site",
    problems: ["Reviews not shown on the website", "No booking button", "Slow mobile load (5.8s)", "Outdated photos"],
    angle: "Put their best reviews front and center, with a booking button under every one.",
    opener: (f, b) => `${f}, ${b} picked up 14 five-star reviews this month, which is great. None of them show up on your website, where people decide whether to call. We can put them front and center with a booking button. Worth a quick look?`,
  },
  {
    trigger: "Site fails on mobile",
    temp: "warm",
    headline: () => "Homepage breaks on phones; menu and phone number unusable",
    problems: ["Not mobile-responsive", "Tap-to-call missing", "Text too small to read", "Copyright footer from 2017"],
    angle: "Side-by-side on a phone: their current homepage vs. a mobile-first rebuild.",
    opener: (f, b) => `${f}, I opened ${b}'s site on my phone and couldn't find a way to call you without zooming in. Most of your customers are on their phones. I mocked up a mobile-first version. Want me to send it over?`,
  },
  {
    trigger: "Domain about to expire",
    temp: "hot",
    headline: () => "Domain expires in 19 days; auto-renew is off",
    problems: ["Domain expiring in 19 days", "Auto-renew off", "Email on the same domain at risk", "No SSL certificate"],
    angle: "Secure the domain, add SSL and move them onto a care plan so this never happens again.",
    opener: (f, b) => `${f}, quick heads up: ${b}'s domain expires in 19 days and auto-renew looks off. If it lapses, your website and email go down with it. We can lock it in and keep it maintained. Want me to walk you through it?`,
  },
  {
    trigger: "Hiring for marketing",
    temp: "cool",
    headline: () => "Posted a marketing coordinator role",
    problems: ["Site has no conversion tracking", "No landing pages for services", "Blog last updated 2021"],
    angle: "A site that does the work of a marketing hire: landing pages, tracking and lead capture.",
    opener: (f, b) => `${f}, I saw ${b} is hiring for marketing. Before they start, it might be worth getting the website working as hard as they will: service pages, tracking and lead capture. Happy to share a quick plan.`,
  },
];

export function websiteLead(r: () => number, only?: string): { trigger: string; title: string; summary: string; lead: LeadDossier } {
  const t = WEB_TRIGGERS.find((x) => x.trigger === only) ?? pick(r, WEB_TRIGGERS);
  const industry = pick(r, WEB_INDUSTRIES);
  const business = businessName(r, industry);
  const { first, last } = person(r);
  const c = contact(r, business, first);
  const town = pick(r, TOWNS);
  const rating = Math.round((3.9 + r() * 1) * 10) / 10;
  const reviews = Math.round(14 + r() * 220);
  const revenue = (0.6 + r() * 2.4).toFixed(1);
  const avgJob = Math.round((900 + r() * 9000) / 100) * 100;
  const hasSite = t.trigger !== "New business registered";
  const lead: LeadDossier = {
    opportunity: "website",
    business,
    industry,
    owner: `${first} ${last}`,
    ownerTitle: t.trigger === "Business changed hands" ? "New owner" : pick(r, ["Owner", "Owner", "Founder", "Co-owner"]),
    location: town,
    phone: c.phone,
    email: c.email,
    currentWebsite: hasSite ? c.domain : "None",
    priority: priorityFor(t.temp),
    temperature: t.temp,
    problems: t.problems,
    google: {
      rating: Math.min(5, rating),
      reviews,
      profile: r() < 0.7 ? "Claimed" : "Unclaimed",
      mapPack: `#${Math.ceil(r() * 9)} for "${industry.toLowerCase()} near me"`,
    },
    reviewsSummary: pick(r, [
      "Customers praise the crew and pricing; several mention the site was hard to use.",
      "Strong word of mouth; recurring complaint is slow replies to quote requests.",
      "Loyal repeat customers; few recent photos of work.",
    ]),
    businessValue: `Est. $${revenue}M revenue · ${Math.round(4 + r() * 20)} staff · avg job $${avgJob.toLocaleString("en-US")}`,
    demoAngle: t.angle,
    recommended: t.trigger === "Domain about to expire" ? { offer: "Domain rescue + Monthly care plan", price: "$450 + $149/mo" } : { offer: "Website rebuild + Monthly care plan", price: `$${(3200 + Math.round(r() * 8) * 200).toLocaleString("en-US")} + $149/mo` },
    upsells: ["Local SEO add-on", "Review widget", "Google Business Profile cleanup", "Online booking"].filter(() => r() > 0.25),
    outreachScript: t.opener(first, business),
    nextMove:
      t.temp === "hot"
        ? `Call ${first} before 10 AM today; owners pick up early. If no answer, send the email and text the preview link.`
        : `Send the email today, follow up with a call in 2 days.`,
  };
  return { trigger: t.trigger, title: business, summary: t.headline(business), lead };
}

/* ------------------------------------------------------------------ */
/* AI implementation opportunities                                     */
/* ------------------------------------------------------------------ */

const AI_TRIGGERS: { trigger: string; temp: LeadTemperature; headline: string; problems: string[]; angle: string; offer: string; opener: (f: string, b: string) => string }[] = [
  {
    trigger: "Hiring for repetitive roles",
    temp: "hot",
    headline: "Posted 3 receptionist roles in 30 days",
    problems: ["High front-desk turnover", "Calls missed at lunch and after 5 PM", "Manual appointment reminders"],
    angle: "An AI receptionist that answers every call, books into their calendar and never quits.",
    offer: "AI receptionist + booking",
    opener: (f, b) => `${f}, I noticed ${b} is hiring three receptionists this month. Before you add headcount, an AI receptionist can answer every call, book appointments and send reminders, 24/7. Want to hear it handle one of your real calls?`,
  },
  {
    trigger: "Reviews mention slow replies",
    temp: "hot",
    headline: "11 reviews mention \"never called back\"",
    problems: ["Slow lead response", "No after-hours coverage", "Leads tracked in a spreadsheet"],
    angle: "Instant replies to every inquiry, day or night, handed to staff with full context.",
    offer: "AI lead response + follow-up",
    opener: (f, b) => `${f}, a few of ${b}'s reviews mention calls that never got returned. That's usually just volume. We set up an assistant that replies to every inquiry in under a minute and hands your team the hot ones. Can I show you how it works?`,
  },
  {
    trigger: "Paper or phone-only booking",
    temp: "warm",
    headline: "Booking by phone only, 9 to 5",
    problems: ["No online booking", "Phone queue at peak hours", "No-show rate unknown"],
    angle: "Online and voice booking with automatic reminders, demoed on their own schedule.",
    offer: "AI booking assistant",
    opener: (f, b) => `${f}, right now people can only book with ${b} by phone during business hours. An AI booking assistant takes bookings around the clock and cuts no-shows with reminders. Want a quick demo?`,
  },
  {
    trigger: "Opening a new location",
    temp: "warm",
    headline: "Second location opening next quarter",
    problems: ["Processes live in one manager's head", "No shared knowledge base", "Training is manual"],
    angle: "An internal AI assistant trained on their procedures, ready for day one at location two.",
    offer: "AI operations assistant",
    opener: (f, b) => `${f}, congrats on ${b}'s second location. The hardest part is usually getting the new team to run things the way you do. We build an AI assistant trained on your procedures so they're never guessing. Worth a conversation?`,
  },
  {
    trigger: "Manual quote process",
    temp: "warm",
    headline: "Quotes by email only, 2-day turnaround",
    problems: ["Quotes written by hand", "2-day response time", "No follow-up on unsigned quotes"],
    angle: "Same-day quotes drafted by AI from a short form, reviewed by staff in one click.",
    offer: "AI quoting + follow-up",
    opener: (f, b) => `${f}, ${b} takes about two days to send a quote, and the first company to reply usually wins. We set up AI that drafts quotes in minutes for your team to approve. Want to see it with one of your services?`,
  },
];

export function aiLead(r: () => number, only?: string): { trigger: string; title: string; summary: string; lead: LeadDossier } {
  const t = AI_TRIGGERS.find((x) => x.trigger === only) ?? pick(r, AI_TRIGGERS);
  const industry = pick(r, AI_INDUSTRIES);
  const business = businessName(r, industry);
  const { first, last } = person(r);
  const c = contact(r, business, first);
  const lead: LeadDossier = {
    opportunity: "ai",
    business,
    industry,
    owner: `${first} ${last}`,
    ownerTitle: pick(r, ["Owner", "Practice Manager", "Operations Director", "Managing Partner"]),
    location: pick(r, TOWNS),
    phone: c.phone,
    email: c.email,
    currentWebsite: c.domain,
    priority: priorityFor(t.temp),
    temperature: t.temp,
    problems: t.problems,
    google: { rating: Math.round((3.6 + r() * 1.3) * 10) / 10, reviews: Math.round(30 + r() * 300), profile: "Claimed", mapPack: `#${Math.ceil(r() * 6)} for "${industry.toLowerCase()} near me"` },
    reviewsSummary: pick(r, ["Great service once you get through; hard to reach by phone.", "Staff are praised; scheduling is the top complaint.", "Loyal clients; several mention slow follow-up."]),
    businessValue: `Est. $${(1 + r() * 6).toFixed(1)}M revenue · ${Math.round(8 + r() * 40)} staff`,
    demoAngle: t.angle,
    recommended: { offer: t.offer, price: `$${(2000 + Math.round(r() * 6) * 250).toLocaleString("en-US")} setup + $${300 + Math.round(r() * 4) * 50}/mo` },
    upsells: ["Review-reply automation", "Staff AI training workshop", "CRM integration", "Monthly optimization"].filter(() => r() > 0.3),
    outreachScript: t.opener(first, business),
    nextMove: t.temp === "hot" ? `Call ${first} today and offer a 15-minute live demo on their own calls.` : `Email ${first} the demo angle; follow up Thursday.`,
  };
  return { trigger: t.trigger, title: business, summary: t.headline, lead };
}

/* ------------------------------------------------------------------ */
/* AI news (sample briefings)                                           */
/* ------------------------------------------------------------------ */

export const NEWS: { title: string; summary: string; why: string }[] = [
  { title: "Voice agents keep getting cheaper to run", summary: "Per-minute costs for AI phone agents continue to fall as models get faster.", why: "An AI receptionist offer can now be priced well below a part-time hire." },
  { title: "More small-business tools ship built-in AI assistants", summary: "Booking, invoicing and CRM tools are adding assistants by default.", why: "Clients will ask how to use them. A setup-and-training package sells itself." },
  { title: "Search results lean harder on reviews and fresh content", summary: "Local results increasingly reward recent reviews and active profiles.", why: "Review widgets and content plans are an easy upsell on every website deal." },
  { title: "Website builders add AI page generation", summary: "DIY builders now draft whole pages from a prompt.", why: "Compete on strategy, conversion and care plans, not on making pages." },
  { title: "Open models improve at reading documents", summary: "Smaller models now extract data from invoices and forms reliably.", why: "Opens an intake and invoice automation offer for accounting and legal clients." },
  { title: "AI disclosure in marketing is getting more attention", summary: "Businesses are reviewing how they label AI-assisted outreach.", why: "Keep your outreach templates clear and transparent before it's required." },
];

/* ------------------------------------------------------------------ */
/* Public helpers                                                      */
/* ------------------------------------------------------------------ */

export { businessName, person, pick as pickFrom, PLACES, TOWNS, WEB_INDUSTRIES };

export function temperatureLabel(t: LeadTemperature) {
  return t === "hot" ? "Hot lead" : t === "warm" ? "Warm lead" : "Cool lead";
}
