import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api";
import type { Lead, Overview, ReferralSummary } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { PushBanner } from "../components/Layout";
import { EarningsTicket } from "./Refer";
import { formatPhone, greeting, timeAgo } from "../util";
import { CountUp } from "../components/Motion";
import { Group, Page, PageBadge, Row, Section } from "../components/Page";

const UPSELL: Record<number, { title: string; body: string }> = {
  2: { title: "Get found on Google", body: "Get Found: 3 pages, Google profile set up, 48-hour edits." },
  3: { title: "Get booked, not just found", body: "Get Booked: managed Google profile, review blasts, 24-hour edits." },
  4: { title: "Let us run your ads", body: "Own Your Market: Meta and Google ads, SEO, same-day edits." },
};
const STATUS: Record<string, string> = { build: "Being built", phase1: "Ready for your review", live: "Live" };

export default function Home() {
  const [o, setO] = useState<Overview | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ref, setRef] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    get<Overview>("/client/overview").then(setO);
    get<{ leads: Lead[] }>("/client/leads").then((r) => setLeads(r.leads));
    get<ReferralSummary>("/client/referrals").then(setRef);
  }, []);
  if (!o) return <Page page="home"><div className="empty">Loading…</div></Page>;

  const waiting = leads.filter((l) => l.status === "new");
  const won = leads.filter((l) => l.status === "won").length;

  return (
    <Page
      page="home"
      heading={`${greeting()}, ${o.owner}.`}
      blurb={waiting.length ? <><span className="accent">{waiting.length} lead{waiting.length > 1 ? "s" : ""}</span> waiting on a call back.</> : "You're all caught up."}
    >
      <PushBanner />

      <div className="figures cards">
        <Link to="/leads" className="figure"><span className="n"><CountUp value={o.leads.last30} /></span><span className="l">Leads</span></Link>
        <Link to="/leads" className="figure"><span className="n"><CountUp value={won} /></span><span className="l">Jobs won</span></Link>
        {ref && <Link to="/refer" className="figure"><span className="n"><CountUp value={ref.stats.earned} prefix="$" /></span><span className="l">Earned</span></Link>}
      </div>

      {waiting.length > 0 && (
        <Section title="Call these back" action={<Link to="/leads" className="btn sm">All leads</Link>}>
          <Group>
            {waiting.slice(0, 3).map((l) => (
              <Row
                key={l.id}
                to={`/leads/${l.id}`}
                title={l.name || formatPhone(l.phone) || l.email}
                meta={`${timeAgo(l.createdAt)}${l.message ? ` · ${l.message}` : ""}`}
                lead={<span className="call-btn"><Icon name="phone" size={16} /></span>}
              />
            ))}
          </Group>
        </Section>
      )}

      <Section title="Go to">
        <Group>
          <Row to="/website" lead={<PageBadge page="website" size={34} />} title="Website" meta={`${o.siteUrl?.replace(/^https?:\/\//, "") || "Your site"} · ${STATUS[o.status]}`} />
          <Row to="/revisions" lead={<PageBadge page="edits" size={34} />} title="Edits" meta={o.openRevisions.length ? `${o.openRevisions.length} in progress` : "Request a change"} />
          <Row to="/help" lead={<PageBadge page="assistant" size={34} />} title="Assistant" meta="Edits, site checks, reach Cam & Trae" />
        </Group>
      </Section>

      {ref && (
        <Section title="Earn" action={<Link to="/refer" className="btn sm">Share link</Link>}>
          <Link to="/refer"><EarningsTicket r={ref} mini /></Link>
        </Section>
      )}

      {o.nextPlan && !o.pendingUpgrade && <Upsell item={`tier-${o.nextPlan.tier}`} {...UPSELL[o.nextPlan.tier]} />}
    </Page>
  );
}
