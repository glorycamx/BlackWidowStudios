import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../api";
import type { Lead, Overview } from "../types";
import { Upsell } from "../components/Upsell";
import { timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";

const RANGES = [
  { key: 1, label: "Today" },
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
];
const STATUS: Record<string, [string, string]> = { new: ["New", "red"], contacted: ["Contacted", ""], won: ["Won", "green"], lost: ["Lost", ""] };

export default function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [range, setRange] = useState(30);
  const { items } = useNotifications();

  useEffect(() => { get<{ leads: Lead[] }>("/client/leads").then((r) => setLeads(r.leads)); }, [items[0]?.id]);
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  if (!leads) return <main className="main"><div className="empty">Loading…</div></main>;

  const inRange = leads.filter((l) => Date.now() - +new Date(l.createdAt) < range * 86400_000);
  const won = inRange.filter((l) => l.status === "won").length;
  const waiting = inRange.filter((l) => l.status === "new").length;

  return (
    <main className="main">
      <div className="page-head">
        <h1>Leads</h1>
        <p className="muted small">{inRange.length} leads · {won} won · {waiting ? <span className="accent">{waiting} waiting</span> : "none waiting"}</p>
      </div>
      <div className="seg">
        {RANGES.map((r) => <button key={r.key} className={range === r.key ? "on" : ""} onClick={() => setRange(r.key)}>{r.label}</button>)}
      </div>

      {inRange.length === 0 ? (
        <div className="empty">No leads in this range.</div>
      ) : (
        <div className="list">
          {inRange.map((l) => (
            <Link key={l.id} to={`/leads/${l.id}`} className="item">
              <div className="grow">
                <div className="title">{l.name || l.phone || l.email}</div>
                <div className="meta ellipsis">{timeAgo(l.createdAt)}{l.message ? ` · ${l.message}` : ""}</div>
              </div>
              <span className={`pill ${STATUS[l.status][1]}`}>{STATUS[l.status][0]}</span>
            </Link>
          ))}
        </div>
      )}

      {o && o.plan.tier < 4 && (
        <Upsell item="ads" title="Want more leads?" body="We run Meta and Google ads that feed straight into this list." cta="Run ads" note="Interested in ads management (from Leads screen)" />
      )}
    </main>
  );
}
