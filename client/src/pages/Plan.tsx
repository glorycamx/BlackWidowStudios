import { useEffect, useState } from "react";
import { get, post } from "../api";
import type { Overview } from "../types";
import { ADDONS, PLANS, type Tier } from "../../../shared/plans";
import { useNotifications } from "../components/Notifications";
import { fmtDate } from "../util";
import { celebrate } from "../motion";
import { Group, Page, Row, Section } from "../components/Page";

export default function Plan() {
  const [o, setO] = useState<Overview | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const { toast } = useNotifications();
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  if (!o) return <Page page="plan" back={{ to: "/more", label: "Account" }}><div className="empty">Loading…</div></Page>;

  const ask = async (item: string, label: string) => {
    await post("/client/upgrades", { item, note: `Tapped "${label}" on the Plan screen` });
    setSent((s) => new Set(s).add(item));
    celebrate();
    toast("Request sent", "Cam will reach out to walk you through it.", "upgrade_request");
  };

  return (
    <Page
      page="plan"
      back={{ to: "/more", label: "Account" }}
      heading={`You're on ${o.plan.name}`}
      blurb={`$${o.plan.monthly}/mo · ${o.plan.revisionTurnaround} edits · ${o.monthlyStartsOn ? `${new Date(o.monthlyStartsOn) > new Date() ? "Monthly billing starts" : "Billed monthly since"} ${fmtDate(o.monthlyStartsOn)}` : "Monthly billing starts 30 days after your site goes live"}`}
    >
      <Section title="Plans">
        {([1, 2, 3, 4] as Tier[]).filter((t) => t >= o.plan.tier).map((t) => {
          const p = PLANS[t];
          const current = t === o.plan.tier;
          return (
            <div key={t} className="group" style={{ padding: 16 }}>
              <div className="row">
                <div className="grow">
                  <h2 className="section-title">{p.name} {current && <span className="pill green" style={{ marginLeft: 6 }}>Your plan</span>}</h2>
                  <div className="row-meta">{p.pages} · {p.revisionLabel} edits</div>
                </div>
                <span className="price">${p.monthly}<span className="small muted">/mo</span></span>
              </div>
              <ul className="plan-list">{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {!current && (
                <button className={`btn ${t === o.plan.tier + 1 ? "primary" : ""} block`} style={{ marginTop: 14 }} disabled={sent.has(`tier-${t}`)} onClick={() => ask(`tier-${t}`, p.name)}>
                  {sent.has(`tier-${t}`) ? "Cam will reach out" : `Upgrade to ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </Section>

      <Section title="Add-ons">
        <Group>
          {ADDONS.map((a) => (
            <Row key={a.id} title={a.title} meta={a.pitch} trail={<button className="btn sm" disabled={sent.has(a.id)} onClick={() => ask(a.id, a.title)}>{sent.has(a.id) ? "Sent ✓" : "Interested"}</button>} />
          ))}
        </Group>
      </Section>
    </Page>
  );
}
