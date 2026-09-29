import { useEffect, useState } from "react";
import { get } from "../api";
import type { Lead, Overview } from "../types";
import { Upsell } from "../components/Upsell";
import { timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";
import { Group, Page, Row } from "../components/Page";

const RANGES = [
  { key: 1, label: "Today" },
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
];
export const LEAD_STATUS: Record<string, [string, string]> = { new: ["New", "red"], contacted: ["Contacted", ""], won: ["Won", "green"], lost: ["Lost", ""] };

export default function Leads() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [range, setRange] = useState(30);
  const { items } = useNotifications();

  useEffect(() => { get<{ leads: Lead[] }>("/client/leads").then((r) => setLeads(r.leads)); }, [items[0]?.id]);
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  if (!leads) return <Page page="leads"><div className="empty">Loading…</div></Page>;

  const inRange = leads.filter((l) => Date.now() - +new Date(l.createdAt) < range * 86400_000);
  const won = inRange.filter((l) => l.status === "won").length;
  const waiting = inRange.filter((l) => l.status === "new").length;

  return (
    <Page page="leads" blurb={<>People who reached out through your website. {inRange.length} leads · {won} won{waiting ? <> · <span className="accent">{waiting} waiting</span></> : null}</>}>
      <div className="seg" role="tablist" aria-label="Time range">
        {RANGES.map((r) => <button key={r.key} role="tab" aria-selected={range === r.key} className={range === r.key ? "on" : ""} onClick={() => setRange(r.key)}>{r.label}</button>)}
      </div>

      {inRange.length === 0 ? (
        <div className="empty">No leads in this range.</div>
      ) : (
        <Group>
          {inRange.map((l) => (
            <Row
              key={l.id}
              to={`/leads/${l.id}`}
              title={l.name || l.phone || l.email}
              meta={`${timeAgo(l.createdAt)}${l.message ? ` · ${l.message}` : ""}`}
              trail={<span className={`pill ${LEAD_STATUS[l.status][1]}`}>{LEAD_STATUS[l.status][0]}</span>}
            />
          ))}
        </Group>
      )}

      {o && o.plan.tier < 4 && (
        <Upsell item="ads" title="Want more leads?" body="We run Meta and Google ads that feed straight into this list." cta="Run ads" note="Interested in ads management (from Leads screen)" />
      )}
    </Page>
  );
}
