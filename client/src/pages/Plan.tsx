import { RevealText } from "../components/Motion";
import { useEffect, useState } from "react";
import { get, post } from "../api";
import type { Overview } from "../types";
import { ADDONS, PLANS, type Tier } from "../../../shared/plans";
import { useNotifications } from "../components/Notifications";
import { fmtDate } from "../util";
import { celebrate } from "../motion";

export default function Plan() {
  const [o, setO] = useState<Overview | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const { toast } = useNotifications();
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  if (!o) return <main className="main"><div className="empty">Loading…</div></main>;

  const ask = async (item: string, label: string) => {
    await post("/client/upgrades", { item, note: `Tapped "${label}" on the Plan screen` });
    setSent((s) => new Set(s).add(item));
    celebrate();
    toast("Request sent", "Cam will reach out to walk you through it.", "upgrade_request");
  };

  return (
    <main className="main">
      <div className="page-head">
        <h1><RevealText text={o.plan.name} /></h1>
        <p className="muted small">${o.plan.monthly}/mo · {o.plan.revisionTurnaround} edits{o.monthlyStartsOn ? ` · monthly starts ${fmtDate(o.monthlyStartsOn)}` : ""}</p>
      </div>

      <div>
        {([1, 2, 3, 4] as Tier[]).filter((t) => t >= o.plan.tier).map((t) => {
          const p = PLANS[t];
          const current = t === o.plan.tier;
          return (
            <div key={t} className="plan">
              <div className="row">
                <div className="grow">
                  <h2>{p.name} {current && <span className="pill green" style={{ marginLeft: 6 }}>Current</span>}</h2>
                  <div className="meta">{p.pages} · {p.revisionLabel} edits</div>
                </div>
                <span className="price">${p.monthly}<span className="small muted">/mo</span></span>
              </div>
              <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {!current && (
                <button className={`btn ${t === o.plan.tier + 1 ? "primary" : ""} block`} style={{ marginTop: 14 }} disabled={sent.has(`tier-${t}`)} onClick={() => ask(`tier-${t}`, p.name)}>
                  {sent.has(`tier-${t}`) ? "Cam will reach out" : `Upgrade to ${p.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="section">
        <span className="label">Add-ons</span>
        <div className="list">
          {ADDONS.map((a) => (
            <div key={a.id} className="item">
              <div className="grow"><div className="title">{a.title}</div><div className="meta">{a.pitch}</div></div>
              <button className="btn sm" disabled={sent.has(a.id)} onClick={() => ask(a.id, a.title)}>{sent.has(a.id) ? "Sent ✓" : "Interested"}</button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
