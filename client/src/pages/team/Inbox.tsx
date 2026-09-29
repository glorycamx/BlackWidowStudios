import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, patch } from "../../api";
import type { Escalation, Revision, Upgrade } from "../../types";
import { useNotifications } from "../../components/Notifications";
import { dueLabel, greeting, timeAgo } from "../../util";
import { useMe } from "../../App";
import { CountUp } from "../../components/Motion";
import { Group, Page, Row, Section } from "../../components/Page";

interface Inbox {
  stats: { clients: number; live: number; mrr: number };
  escalations: Escalation[];
  revisions: (Revision & { client: { businessName: string } })[];
  upgrades: Upgrade[];
  referrals: { id: number; name: string; business: string | null; phone: string | null; status: string; clientId: number; createdAt: string; client: { businessName: string } }[];
}
const CAT: Record<string, string> = { billing: "Billing", site_down: "Site down", unhappy: "Unhappy", human_requested: "Wants a person", account_access: "Account access", out_of_scope: "Out of scope", bug: "Assistant error", other: "Other" };
const selectStyle = { width: 112, padding: "6px 8px", fontSize: 13 };

export default function Inbox() {
  const [d, setD] = useState<Inbox | null>(null);
  const { items } = useNotifications();
  const { me } = useMe();
  const load = () => get<Inbox>("/team/inbox").then(setD);
  useEffect(() => { load(); }, [items[0]?.id]);
  if (!d) return <Page page="inbox" wide><div className="empty">Loading…</div></Page>;
  const act = async (path: string, status: string) => { await patch(path, { status }); load(); };
  const open = (id: number) => <Link to={`/team/clients/${id}`} className="btn sm">Open</Link>;

  return (
    <Page
      page="inbox"
      wide
      heading={`${greeting()}, ${me?.name}.`}
      blurb={<>{d.escalations.length ? <span className="accent">{d.escalations.length} need{d.escalations.length === 1 ? "s" : ""} you</span> : "Nothing needs you"} · {d.revisions.length} edits open · {d.upgrades.length} upsells</>}
    >
      <div className="figures cards">
        <div className="figure"><span className="n"><CountUp value={d.stats.mrr} prefix="$" ms={1300} /></span><span className="l">Monthly recurring</span></div>
        <Link to="/team/clients" className="figure"><span className="n">{d.stats.live}/{d.stats.clients}</span><span className="l">Sites live</span></Link>
        <div className="figure"><span className="n"><CountUp value={d.upgrades.length} /></span><span className="l">Hot upsells</span></div>
      </div>

      <div className="team-grid">
        <div className="stack">
          <Section title="Needs you">
            {d.escalations.length === 0 ? <div className="empty">All clear.</div> : (
              <Group>
                {d.escalations.map((e) => (
                  <Row
                    key={e.id}
                    lead={<span className={`sdot ${e.urgency === "urgent" ? "red" : "amber"}`} />}
                    title={e.client?.businessName}
                    meta={<>{e.urgency === "urgent" ? <b className="accent">Urgent · </b> : null}{CAT[e.category] || e.category} · {timeAgo(e.createdAt)} · {e.summary}</>}
                    trail={<div className="btn-row" style={{ flexWrap: "nowrap" }}>{open(e.clientId)}<button className="btn sm primary" onClick={() => act(`/team/escalations/${e.id}`, "resolved")}>Done</button></div>}
                  />
                ))}
              </Group>
            )}
          </Section>

          <Section title="Upsell requests">
            {d.upgrades.length === 0 ? <div className="empty">None open.</div> : (
              <Group>
                {d.upgrades.map((u) => (
                  <Row
                    key={u.id}
                    title={u.client?.businessName}
                    meta={`${u.label} · ${timeAgo(u.createdAt)}`}
                    trail={
                      <select style={selectStyle} value={u.status} onChange={(e) => act(`/team/upgrades/${u.id}`, e.target.value)} aria-label="Upsell status">
                        <option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option>
                      </select>
                    }
                  />
                ))}
              </Group>
            )}
          </Section>
        </div>

        <div className="stack">
          <Section title="Edits due">
            {d.revisions.length === 0 ? <div className="empty">All shipped.</div> : (
              <Group>
                {d.revisions.map((r) => {
                  const overdue = new Date(r.dueAt).getTime() < Date.now();
                  return (
                    <Row
                      key={r.id}
                      title={r.title}
                      meta={<>{r.client.businessName} · {overdue ? <b className="accent">overdue</b> : dueLabel(r.dueAt)}</>}
                      trail={
                        <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                          {r.status === "open" && <button className="btn sm" onClick={() => act(`/team/revisions/${r.id}`, "in_progress")}>Start</button>}
                          <button className="btn sm primary" onClick={() => act(`/team/revisions/${r.id}`, "done")}>Done</button>
                        </div>
                      }
                    />
                  );
                })}
              </Group>
            )}
          </Section>

          <Section title="Referrals">
            {d.referrals.length === 0 ? <div className="empty">None open.</div> : (
              <Group>
                {d.referrals.map((r) => (
                  <Row
                    key={r.id}
                    title={<>{r.name}{r.business ? <span className="muted"> · {r.business}</span> : null}</>}
                    meta={`from ${r.client.businessName}${r.phone ? ` · ${r.phone}` : ""}`}
                    trail={
                      <select style={selectStyle} value={r.status} onChange={(e) => act(`/team/referrals/${r.id}`, e.target.value)} aria-label="Referral status">
                        <option value="new">New</option><option value="contacted">Talking</option><option value="signed">Signed</option><option value="lost">Lost</option>
                      </select>
                    }
                  />
                ))}
              </Group>
            )}
          </Section>
        </div>
      </div>
    </Page>
  );
}
