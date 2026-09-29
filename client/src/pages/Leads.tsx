import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api";
import type { Lead, Overview } from "../types";
import { Upsell } from "../components/Upsell";
import { Sparkline, dailyCounts } from "../components/Sparkline";
import { timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";

const RANGES = [
  { key: 1, label: "Today" },
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
];
const STATUS: Record<string, [string, string]> = { new: ["New", "red"], contacted: ["Contacted", "amber"], won: ["Won", "green"], lost: ["Lost", ""] };
const BAR: Record<string, string> = { new: "red", contacted: "amber", won: "green", lost: "" };

export default function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [range, setRange] = useState(30);
  const { items } = useNotifications();

  // Refetch whenever a new notification lands (new lead)
  useEffect(() => {
    get<{ leads: Lead[] }>("/client/leads").then((r) => setLeads(r.leads));
  }, [items[0]?.id]);
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);

  if (!leads) return <main className="main"><div className="empty">Loading…</div></main>;
  const inRange = leads.filter((l) => Date.now() - +new Date(l.createdAt) < range * 86400_000);
  const won = inRange.filter((l) => l.status === "won").length;
  const waiting = inRange.filter((l) => l.status === "new").length;

  return (
    <main className="main">
      <div style={{ padding: "10px 2px 0" }}>
        <h1>Leads</h1>
        <p className="muted small" style={{ marginTop: 4 }}>Every form on your site lands here, and your phone buzzes.</p>
      </div>
      <div className="seg">
        {RANGES.map((r) => <button key={r.key} className={range === r.key ? "on" : ""} onClick={() => setRange(r.key)}>{r.label}</button>)}
      </div>
      <div className="grid2">
        <div className="stat"><span className="label">New leads</span><span className="num">{inRange.length}</span><Sparkline values={dailyCounts(leads.map((l) => l.createdAt), Math.max(range, 7))} /></div>
        <div className="stat"><span className="label">Won · waiting</span><span className="num">{won} <span className="muted" style={{ fontSize: 16 }}>· {waiting}</span></span><span className={`delta ${waiting ? "down" : ""}`}>{waiting ? `${waiting} need a call back` : "All caught up"}</span></div>
      </div>

      <div className="card">
        {inRange.length === 0 ? (
          <div className="empty">No leads in this range yet.</div>
        ) : (
          <div className="list">
            {inRange.map((l) => (
              <Link key={l.id} to={`/leads/${l.id}`} className="item">
                <div className={`bar ${BAR[l.status]}`} />
                <div className="grow">
                  <div className="meta">{timeAgo(l.createdAt)} · {l.source}</div>
                  <div style={{ fontWeight: 600 }}>{l.name || l.phone || l.email}</div>
                  {l.message && <div className="small muted ellipsis">{l.message}</div>}
                </div>
                <span className={`pill ${STATUS[l.status][1]}`}>{STATUS[l.status][0]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {o && o.plan.tier < 4 && (
        <Upsell
          item="ads"
          eyebrow="Want more of these?"
          title="We'll run ads that send leads straight here."
          body="Meta and Google ads, built and managed by us, feeding this exact inbox. You just answer the phone."
          cta="Run ads for me"
          note="Interested in ads management (from Leads screen)"
        />
      )}
    </main>
  );
}
