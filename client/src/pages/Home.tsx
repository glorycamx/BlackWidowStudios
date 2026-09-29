import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api";
import type { Lead, Overview, ReferralSummary } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { PushBanner } from "../components/Layout";
import { EarningsTicket } from "./Refer";
import { greeting, timeAgo } from "../util";
import { CountUp, RevealText } from "../components/Motion";

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
  if (!o) return <main className="main"><div className="empty">Loading…</div></main>;

  const waiting = leads.filter((l) => l.status === "new");
  const won = leads.filter((l) => l.status === "won").length;

  return (
    <main className="main">
      <div className="page-head">
        <div className="date-line">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1><RevealText text={`${greeting()}, ${o.owner}.`} /></h1>
        <p className="muted">{waiting.length ? <><span className="accent">{waiting.length} lead{waiting.length > 1 ? "s" : ""}</span> waiting on a call back.</> : "You're all caught up."}</p>
      </div>

      <PushBanner />

      {waiting.length > 0 && (
        <div className="list">
          {waiting.slice(0, 3).map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} className="item">
              <div className="grow">
                <div className="title">{l.name || l.phone || l.email}</div>
                <div className="meta ellipsis">{timeAgo(l.createdAt)}{l.message ? ` · ${l.message}` : ""}</div>
              </div>
              <span className="call-btn"><Icon name="phone" size={16} /></span>
            </Link>
          ))}
        </div>
      )}

      <div className="figures">
        <Link to="/leads" className="figure"><span className="n"><CountUp value={o.leads.last30} /></span><span className="l">leads this month</span></Link>
        <Link to="/leads" className="figure"><span className="n"><CountUp value={won} /></span><span className="l">jobs won</span></Link>
        {ref && <Link to="/refer" className="figure"><span className="n"><CountUp value={ref.stats.earned} prefix="$" /></span><span className="l">referral credit</span></Link>}
      </div>

      <Link to="/website" className="list">
        <div className="item">
          <span className={`sdot ${o.status === "live" ? "green" : "amber"}`} />
          <div className="grow">
            <div className="title ellipsis">{o.siteUrl?.replace(/^https?:\/\//, "") || "Your website"}</div>
            <div className="meta">{STATUS[o.status]}{o.openRevisions.length ? ` · ${o.openRevisions.length} edit${o.openRevisions.length > 1 ? "s" : ""} in progress` : ""}</div>
          </div>
          <Icon name="arrow" size={16} />
        </div>
      </Link>

      {ref && (
        <Link to="/refer" className="col" style={{ gap: 8 }}>
          <EarningsTicket r={ref} mini />
          <span className="small muted">${ref.program.perSignup} off your bill for every business you send us. <span style={{ color: "var(--text)", fontWeight: 500 }}>Share your link →</span></span>
        </Link>
      )}

      {o.nextPlan && !o.pendingUpgrade && <Upsell item={`tier-${o.nextPlan.tier}`} {...UPSELL[o.nextPlan.tier]} />}
    </main>
  );
}
