import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, patch } from "../../api";
import type { Escalation, Revision, Upgrade } from "../../types";
import { useNotifications } from "../../components/Notifications";
import { dueLabel, greeting, timeAgo } from "../../util";
import { useMe } from "../../App";
import { CountUp, RevealText } from "../../components/Motion";

interface Inbox {
  stats: { clients: number; live: number; mrr: number };
  escalations: Escalation[];
  revisions: (Revision & { client: { businessName: string } })[];
  upgrades: Upgrade[];
  referrals: { id: number; name: string; business: string | null; phone: string | null; status: string; clientId: number; createdAt: string; client: { businessName: string } }[];
}
const CAT: Record<string, string> = { billing: "Billing", site_down: "Site down", unhappy: "Unhappy", human_requested: "Wants a person", account_access: "Account access", out_of_scope: "Out of scope", bug: "Assistant error", other: "Other" };
const selectStyle = { width: 112, padding: "5px 8px", fontSize: 13 };

export default function Inbox() {
  const [d, setD] = useState<Inbox | null>(null);
  const { items } = useNotifications();
  const { me } = useMe();
  const load = () => get<Inbox>("/team/inbox").then(setD);
  useEffect(() => { load(); }, [items[0]?.id]);
  if (!d) return <main className="main wide"><div className="empty">Loading…</div></main>;
  const act = async (path: string, status: string) => { await patch(path, { status }); load(); };

  return (
    <main className="main wide">
      <div className="page-head">
        <h1><RevealText text={`${greeting()}, ${me?.name}.`} /></h1>
        <p className="muted small">{d.escalations.length ? <span className="accent">{d.escalations.length} need{d.escalations.length === 1 ? "s" : ""} you</span> : "Nothing needs you"} · {d.revisions.length} edits open · {d.upgrades.length} upsells</p>
      </div>

      <div className="figures">
        <div className="figure"><span className="n"><CountUp value={d.stats.mrr} prefix="$" ms={1300} /></span><span className="l">monthly recurring</span></div>
        <div className="figure"><span className="n">{d.stats.live}/{d.stats.clients}</span><span className="l">sites live</span></div>
      </div>

      <div className="team-grid">
        <div className="stack">
          <div className="section">
            <span className="label">Needs you</span>
            {d.escalations.length === 0 ? <div className="empty">All clear.</div> : (
              <div className="list">
                {d.escalations.map((e) => (
                  <div key={e.id} className="item">
                    <span className={`sdot ${e.urgency === "urgent" ? "red" : "amber"}`} />
                    <Link to={`/team/clients/${e.clientId}`} className="grow">
                      <div className="title">{e.client?.businessName}</div>
                      <div className="meta">{e.urgency === "urgent" ? <b>Urgent · </b> : null}{CAT[e.category] || e.category} · {timeAgo(e.createdAt)}</div>
                      <div className="small muted">{e.summary}</div>
                    </Link>
                    <button className="btn sm" onClick={() => act(`/team/escalations/${e.id}`, "resolved")}>Done</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="section">
            <span className="label">Upsells</span>
            {d.upgrades.length === 0 ? <div className="empty">None open.</div> : (
              <div className="list">
                {d.upgrades.map((u) => (
                  <div key={u.id} className="item">
                    <Link to={`/team/clients/${u.clientId}`} className="grow">
                      <div className="title">{u.client?.businessName}</div>
                      <div className="meta">{u.label} · {timeAgo(u.createdAt)}</div>
                    </Link>
                    <select style={selectStyle} value={u.status} onChange={(e) => act(`/team/upgrades/${u.id}`, e.target.value)}>
                      <option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option>
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <div className="section">
            <span className="label">Edits due</span>
            {d.revisions.length === 0 ? <div className="empty">All shipped.</div> : (
              <div className="list">
                {d.revisions.map((r) => {
                  const overdue = new Date(r.dueAt).getTime() < Date.now();
                  return (
                    <div key={r.id} className="item">
                      <Link to={`/team/clients/${r.clientId}`} className="grow">
                        <div className="title">{r.title}</div>
                        <div className="meta">{r.client.businessName} · {overdue ? <b>overdue</b> : dueLabel(r.dueAt)}</div>
                      </Link>
                      {r.status === "open" && <button className="btn sm" onClick={() => act(`/team/revisions/${r.id}`, "in_progress")}>Start</button>}
                      <button className="btn sm primary" onClick={() => act(`/team/revisions/${r.id}`, "done")}>Done</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="section">
            <span className="label">Referrals</span>
            {d.referrals.length === 0 ? <div className="empty">None open.</div> : (
              <div className="list">
                {d.referrals.map((r) => (
                  <div key={r.id} className="item">
                    <div className="grow">
                      <div className="title">{r.name}{r.business ? <span className="muted"> · {r.business}</span> : null}</div>
                      <div className="meta">from {r.client.businessName}{r.phone ? <> · <a href={`tel:${r.phone}`}>{r.phone}</a></> : null}</div>
                    </div>
                    <select style={selectStyle} value={r.status} onChange={(e) => act(`/team/referrals/${r.id}`, e.target.value)}>
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
