import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, patch } from "../../api";
import type { Escalation, Revision, Upgrade } from "../../types";
import { Icon } from "../../components/Icon";
import { useNotifications } from "../../components/Notifications";
import { dueLabel, greeting, timeAgo } from "../../util";
import { useMe } from "../../App";

interface Inbox {
  stats: { clients: number; live: number; mrr: number };
  escalations: Escalation[];
  revisions: (Revision & { client: { businessName: string } })[];
  upgrades: Upgrade[];
  referrals: { id: number; name: string; business: string | null; phone: string | null; status: string; clientId: number; createdAt: string; client: { businessName: string } }[];
}
const CAT: Record<string, string> = { billing: "Billing", site_down: "Site / form down", unhappy: "Unhappy", human_requested: "Wants a person", account_access: "Account access", out_of_scope: "Out of scope", bug: "Assistant error", other: "Other" };

export default function Inbox() {
  const [d, setD] = useState<Inbox | null>(null);
  const { items } = useNotifications();
  const { me } = useMe();
  const load = () => get<Inbox>("/team/inbox").then(setD);
  useEffect(() => { load(); }, [items[0]?.id]);
  if (!d) return <main className="main wide"><div className="empty">Loading…</div></main>;

  const act = async (path: string, status: string) => { await patch(path, { status }); load(); };
  const urgent = d.escalations.filter((e) => e.urgency === "urgent").length;

  return (
    <main className="main wide">
      <div style={{ padding: "10px 2px 0" }}>
        <div className="date-line">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <h1 style={{ marginTop: 6 }}>{greeting()}, {me?.name}. {d.escalations.length ? <><span className="accent">{d.escalations.length} client{d.escalations.length > 1 ? "s" : ""}</span> need{d.escalations.length === 1 ? "s" : ""} you{urgent ? `, ${urgent} urgent` : ""}.</> : <>Inbox is <span className="accent">clear</span>.</>}</h1>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="stat"><span className="label">MRR (live)</span><span className="num">${d.stats.mrr.toLocaleString()}</span></div>
        <div className="stat"><span className="label">Live sites</span><span className="num">{d.stats.live}<span className="muted" style={{ fontSize: 15 }}>/{d.stats.clients}</span></span></div>
        <div className="stat"><span className="label">Hot upsells</span><span className="num" style={{ color: "var(--red-text)" }}>{d.upgrades.length}</span></div>
      </div>

      <div className="team-grid stack">
        <div className="stack">
          <div className="card">
            <div className="card-head"><h2><span className="ic">🚨</span> Needs you</h2><span className="pill red">{d.escalations.length}</span></div>
            {d.escalations.length === 0 ? <div className="empty">Nothing escalated. The assistant's got it.</div> : (
              <div className="list">
                {d.escalations.map((e) => (
                  <div key={e.id} className="item">
                    <div className={`bar ${e.urgency === "urgent" ? "red" : "amber"}`} />
                    <Link to={`/team/clients/${e.clientId}`} className="grow">
                      <div className="meta">{timeAgo(e.createdAt)} · <b>{e.urgency === "urgent" ? "URGENT" : CAT[e.category] || e.category}</b></div>
                      <div style={{ fontWeight: 600 }}>{e.client?.businessName}</div>
                      <div className="small muted">{e.summary}</div>
                    </Link>
                    <button className="btn sm" onClick={() => act(`/team/escalations/${e.id}`, "resolved")}><Icon name="check" size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2><span className="ic">💰</span> Upsell requests</h2><span className="pill gold">{d.upgrades.length}</span></div>
            {d.upgrades.length === 0 ? <div className="empty">No open upgrade requests.</div> : (
              <div className="list">
                {d.upgrades.map((u) => (
                  <div key={u.id} className="item">
                    <div className="bar violet" />
                    <Link to={`/team/clients/${u.clientId}`} className="grow">
                      <div className="meta">{timeAgo(u.createdAt)} · via {u.source}</div>
                      <div style={{ fontWeight: 600 }}>{u.client?.businessName}: <span className="accent">{u.label}</span></div>
                      {u.note && <div className="small muted">“{u.note}”</div>}
                    </Link>
                    <select style={{ width: 118, padding: "6px 8px", fontSize: 13 }} value={u.status} onChange={(e) => act(`/team/upgrades/${u.id}`, e.target.value)}>
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won 🎉</option><option value="lost">Lost</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head"><h2><span className="ic">📝</span> Edits due</h2><span className="pill">{d.revisions.length}</span></div>
            {d.revisions.length === 0 ? <div className="empty">All edits shipped.</div> : (
              <div className="list">
                {d.revisions.map((r) => {
                  const overdue = new Date(r.dueAt).getTime() < Date.now();
                  return (
                    <div key={r.id} className="item">
                      <div className={`bar ${overdue ? "red" : r.status === "in_progress" ? "green" : "amber"}`} />
                      <Link to={`/team/clients/${r.clientId}`} className="grow">
                        <div className="meta">{r.client.businessName} · <b>{dueLabel(r.dueAt)}</b></div>
                        <div style={{ fontWeight: 600 }}>{r.title}</div>
                      </Link>
                      <div className="col" style={{ gap: 6 }}>
                        {r.status === "open" && <button className="btn sm" onClick={() => act(`/team/revisions/${r.id}`, "in_progress")}>Start</button>}
                        <button className="btn sm primary" onClick={() => act(`/team/revisions/${r.id}`, "done")}>Done</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h2><span className="ic">🤝</span> Referrals</h2><span className="pill green">{d.referrals.length}</span></div>
            {d.referrals.length === 0 ? <div className="empty">No open referrals.</div> : (
              <div className="list">
                {d.referrals.map((r) => (
                  <div key={r.id} className="item">
                    <div className="bar green" />
                    <div className="grow">
                      <div className="meta">from {r.client.businessName} · {timeAgo(r.createdAt)}</div>
                      <div style={{ fontWeight: 600 }}>{r.name}{r.business ? ` · ${r.business}` : ""}</div>
                      {r.phone && <a className="small accent" href={`tel:${r.phone}`}>{r.phone}</a>}
                    </div>
                    <select style={{ width: 118, padding: "6px 8px", fontSize: 13 }} value={r.status} onChange={(e) => act(`/team/referrals/${r.id}`, e.target.value)}>
                      <option value="new">New</option><option value="contacted">Talking</option><option value="signed">Signed</option><option value="lost">Lost</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
