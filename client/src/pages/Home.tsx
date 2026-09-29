import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import type { Lead, Overview, ReferralSummary } from "../types";
import { EarningsTicket } from "./Refer";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { PushBanner } from "../components/Layout";
import { Sparkline, dailyCounts } from "../components/Sparkline";
import { dueLabel, fmtDate, greeting, timeAgo } from "../util";

const UPSELL: Record<number, { title: string; body: string }> = {
  2: { title: "Get found on Google.", body: "Get Found gives you a 3-page site, your Google Business Profile set up, and 48-hour edits." },
  3: { title: "Get booked, not just found.", body: "We manage your Google profile with 2 posts a week, run a monthly review blast, set up email at your domain, and turn edits around in 24 hours." },
  4: { title: "Let us run your ads and fill your calendar.", body: "Meta and Google ads managed for you, unlimited pages, full SEO, and same-day edits." },
};

const STEPS = [
  { key: "build", label: "Building your site" },
  { key: "phase1", label: "Phase 1 review" },
  { key: "live", label: "Live" },
];

export default function Home() {
  const [o, setO] = useState<Overview | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [check, setCheck] = useState<string>("");
  const [ref, setRef] = useState<ReferralSummary | null>(null);

  useEffect(() => {
    get<Overview>("/client/overview").then(setO);
    get<{ leads: Lead[] }>("/client/leads").then((r) => setLeads(r.leads));
    get<ReferralSummary>("/client/referrals").then(setRef);
  }, []);
  if (!o) return <main className="main"><div className="empty">Loading…</div></main>;

  const waiting = leads.filter((l) => l.status === "new").slice(0, 3);
  const won = leads.filter((l) => l.status === "won").length;
  const spark = dailyCounts(leads.map((l) => l.createdAt), 14);
  const stepIdx = STEPS.findIndex((s) => s.key === o.status);
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <main className="main">
      <div style={{ padding: "10px 2px 4px" }}>
        <div className="date-line">{today}</div>
        <h1 style={{ marginTop: 6 }}>
          {greeting()}, {o.owner}.{" "}
          {waiting.length ? <>You've got <span className="accent">{waiting.length} lead{waiting.length > 1 ? "s" : ""}</span> waiting.</> : <>Here's how <span className="accent">your site</span> is doing.</>}
        </h1>
      </div>

      <PushBanner />

      {waiting.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2><span className="ic"><Icon name="phone" size={16} /></span> Call back <span className="muted" style={{ fontWeight: 500 }}>{waiting.length} new</span></h2>
            <Link to="/leads" className="small accent" style={{ fontWeight: 600 }}>All leads</Link>
          </div>
          <div className="list">
            {waiting.map((l, i) => (
              <Link key={l.id} to={`/leads/${l.id}`} className="item">
                <div className={`bar ${i === 0 ? "red" : i === 1 ? "violet" : "amber"}`} />
                <div className="grow">
                  <div className="meta">{timeAgo(l.createdAt)} · <b>{Date.now() - +new Date(l.createdAt) < 3600_000 ? "Call now" : "Waiting"}</b></div>
                  <div style={{ fontWeight: 600 }}>{l.name || l.phone || l.email}</div>
                  {l.message && <div className="small muted ellipsis">{l.message}</div>}
                </div>
                <span className="action primary"><span style={{ width: 40, height: 40 }}><Icon name="phone" size={18} /></span></span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid2">
        <Link to="/leads" className="stat">
          <span className="label">Leads · 30 days</span>
          <span className="num">{o.leads.last30}</span>
          <span className="delta">↗ from your website</span>
          <Sparkline values={spark} />
        </Link>
        <Link to="/leads" className="stat">
          <span className="label">Jobs won</span>
          <span className="num">{won}</span>
          <span className="delta">{o.leads.total ? Math.round((won / o.leads.total) * 100) : 0}% close rate</span>
          <Sparkline values={dailyCounts(leads.filter((l) => l.status === "won").map((l) => l.createdAt), 14)} color="var(--green)" />
        </Link>
      </div>

      <div className="card">
        <div className="card-head">
          <h2><span className="ic"><Icon name="globe" size={16} /></span> Your website</h2>
          <span className={`pill ${o.status === "live" ? "green" : "amber"}`}>{STEPS[stepIdx]?.label}</span>
        </div>
        {o.status !== "live" ? (
          <>
            <div className="steps">{STEPS.map((s, i) => <div key={s.key} className={i <= stepIdx ? "on" : ""} />)}</div>
            <p className="small muted" style={{ marginTop: 10 }}>
              {o.status === "build" ? "Our design team is building your site. We'll buzz you when it's ready for your Phase 1 review." : "Your Phase 1 review is next. Tell the assistant anything you want changed."}
              {" "}Your monthly doesn't start until 30 days after you go live.
            </p>
          </>
        ) : (
          <div className="col">
            <Link to="/website" className="row">
              <div className="grow">
                <div style={{ fontWeight: 600 }} className="ellipsis">{o.siteUrl?.replace(/^https?:\/\//, "")}</div>
                <div className="small muted">Live since {fmtDate(o.goLiveDate)} · stats, photos & quick edits →</div>
              </div>
              <button className="btn sm" onClick={async (e) => { e.preventDefault(); setCheck("Checking…"); const r = await post("/client/site-check"); setCheck(r.detail); }}>
                <Icon name="pulse" size={16} /> Check
              </button>
            </Link>
            {check && <div className="small">{check}</div>}
          </div>
        )}
      </div>

      {ref && (
        <Link to="/refer" className="col" style={{ gap: 8 }}>
          <EarningsTicket r={ref} mini />
          <div className="row small" style={{ padding: "0 4px" }}>
            <span className="muted grow">Send a business our way: ${ref.program.perSignup} off per signup, +${ref.program.cardBonus} per full punch card.</span>
            <span className="accent" style={{ fontWeight: 700 }}>Share →</span>
          </div>
        </Link>
      )}

      {o.openRevisions.length > 0 && (
        <div className="card">
          <div className="card-head">
            <h2><span className="ic"><Icon name="edit" size={16} /></span> Edits in progress</h2>
            <Link to="/revisions" className="small accent" style={{ fontWeight: 600 }}>View</Link>
          </div>
          <div className="list">
            {o.openRevisions.slice(0, 3).map((r) => (
              <div key={r.id} className="item">
                <div className={`bar ${r.status === "in_progress" ? "green" : "amber"}`} />
                <div className="grow">
                  <div className="meta">{r.status === "in_progress" ? "In progress" : "Queued"} · <b>{dueLabel(r.dueAt)}</b></div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {o.nextPlan && !o.pendingUpgrade && (
        <Upsell
          item={`tier-${o.nextPlan.tier}`}
          eyebrow={`Upgrade · $${o.nextPlan.monthly}/mo`}
          title={UPSELL[o.nextPlan.tier].title}
          body={UPSELL[o.nextPlan.tier].body}
          cta="Tell me more"
        />
      )}

      <Link to="/help" className="card row" style={{ gap: 12 }}>
        <span className="spark-pill"><Icon name="sparkle" size={15} /> Ask the assistant</span>
        <span className="small muted grow">Edits, site issues, or reach Cam and Trae.</span>
      </Link>

    </main>
  );
}
