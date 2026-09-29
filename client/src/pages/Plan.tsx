import { useEffect, useState } from "react";
import { get, post } from "../api";
import type { Overview } from "../types";
import { ADDONS, PLANS, type Tier } from "../../../shared/plans";
import { Icon } from "../components/Icon";
import { useNotifications } from "../components/Notifications";
import { fmtDate } from "../util";

export default function Plan() {
  const [o, setO] = useState<Overview | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const { toast } = useNotifications();
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  if (!o) return <main className="main"><div className="empty">Loading…</div></main>;

  const ask = async (item: string, label: string) => {
    await post("/client/upgrades", { item, note: `Tapped "${label}" on the Plan screen` });
    setSent((s) => new Set(s).add(item));
    toast("Request sent 🚀", "Cam will reach out shortly to walk you through it.", "upgrade_request");
  };

  return (
    <main className="main">
      <div style={{ padding: "10px 2px 0" }}>
        <div className="date-line">Your plan</div>
        <h1 style={{ marginTop: 6 }}>You're on <span className="accent">{o.plan.name}</span>.</h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          ${o.plan.monthly}/mo · {o.plan.revisionTurnaround} edits
          {o.monthlyStartsOn && ` · monthly starts ${fmtDate(o.monthlyStartsOn)}`}
        </p>
      </div>

      {([1, 2, 3, 4] as Tier[]).filter((t) => t >= o.plan.tier).map((t) => {
        const p = PLANS[t];
        const current = t === o.plan.tier;
        const rec = t === o.plan.tier + 1;
        return (
          <div key={t} className={`plan ${current ? "current" : ""} ${rec ? "recommended" : ""}`}>
            <div className="row">
              <div className="grow">
                <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                  <h2 style={{ whiteSpace: "nowrap" }}>{p.name}</h2>
                  {current && <span className="pill green">Current</span>}
                  {rec && <span className="pill red">Recommended</span>}
                </div>
                <div className="small muted">{p.pages} · {p.revisionLabel} edits</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="price">${p.monthly}<span className="small muted" style={{ fontFamily: "Inter" }}>/mo</span></div>
              </div>
            </div>
            <ul>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {!current && (
              <button className={`btn ${rec ? "primary" : ""} block`} style={{ marginTop: 14 }} disabled={sent.has(`tier-${t}`)} onClick={() => ask(`tier-${t}`, p.name)}>
                {sent.has(`tier-${t}`) ? <><Icon name="check" size={18} /> Cam will reach out</> : <>Upgrade to {p.name}</>}
              </button>
            )}
          </div>
        );
      })}

      <div style={{ padding: "8px 2px 0" }}><h2>Add-ons</h2><p className="small muted">Available on any plan.</p></div>
      <div className="grid2">
        {ADDONS.map((a) => (
          <div key={a.id} className="card col" style={{ gap: 8 }}>
            <h3>{a.title}</h3>
            <p className="small muted grow">{a.pitch}</p>
            <button className="btn sm" disabled={sent.has(a.id)} onClick={() => ask(a.id, a.title)}>{sent.has(a.id) ? "Requested ✓" : "I'm interested"}</button>
          </div>
        ))}
      </div>
    </main>
  );
}
