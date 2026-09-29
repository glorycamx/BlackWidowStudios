import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { del, get, patch, post } from "../../api";
import type { ChatMessage, Client, Escalation, Lead, Referral, Revision, Upgrade, WebsiteStats } from "../../types";
import { photoSrc } from "../../photos";
import { Group, Page, Row, Section } from "../../components/Page";
import { LEAD_STATUS } from "../Leads";
import { Icon } from "../../components/Icon";
import { useNotifications } from "../../components/Notifications";
import { PLANS, nextPlan, type Tier } from "../../../../shared/plans";
import { dueLabel, formatPhone, timeAgo } from "../../util";
import { useMe } from "../../App";
import { CopyButton } from "../../components/CopyButton";
import { ClientForm } from "./ClientForm";

interface Detail {
  client: Client;
  chat: ChatMessage[];
  revisions: Revision[];
  leads: Lead[];
  escalations: Escalation[];
  upgrades: Upgrade[];
  referrals: Referral[];
  logins: { id: number; email: string; name: string }[];
  website: WebsiteStats;
}

const TABS = ["Chat", "Edits", "Site", "Leads", "Referrals", "Upsell", "Account"] as const;

export const ESC_LABEL: Record<string, string> = { billing: "Billing", site_down: "Site or form down", unhappy: "Unhappy", human_requested: "Wants a person", account_access: "Account access", out_of_scope: "Out of scope", bug: "Assistant error", other: "Other" };
const BY: Record<string, string> = { client: "the client", bot: "the assistant", team: "the team" };
const selectStyle = { width: 118, padding: "6px 8px", fontSize: 13 };

export default function ClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState<Detail | null>(null);
  const [missing, setMissing] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Chat");
  const { items, toast } = useNotifications();
  const load = () => get<Detail>(`/team/clients/${id}`).then(setD).catch(() => setMissing(true));
  useEffect(() => { load(); }, [id, items[0]?.id]);
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, [id]);
  const back = { to: "/team/clients", label: "Clients" };
  const { info } = useMe();
  if (missing && !d) return <Page page="client" back={back}><div className="empty">This client doesn't exist anymore.</div></Page>;
  if (!d) return <Page page="client" back={back}><div className="empty">Loading…</div></Page>;

  const c = d.client;
  const plan = PLANS[c.tier as Tier];
  const openEsc = d.escalations.filter((e) => e.status === "open");
  const tel = c.phone?.replace(/[^\d+]/g, "");

  return (
    <Page
      page="client"
      back={back}
      heading={c.businessName}
      blurb={`${c.ownerName} · ${plan.name} ($${plan.monthly}/mo) · ${c.status === "live" ? "Live" : c.status === "phase1" ? "Phase 1" : "Building"}`}
    >
      <div className="actions" style={{ justifyContent: "flex-start" }}>
        <a className="action primary" href={tel ? `tel:${tel}` : undefined}><span><Icon name="phone" /></span>Call</a>
        <a className="action" href={tel ? `sms:${tel}` : undefined}><span><Icon name="text" /></span>Text</a>
        <a className="action" href={c.email ? `mailto:${c.email}` : undefined}><span><Icon name="mail" /></span>Email</a>
        <button className="action" onClick={() => setTab("Upsell")}><span><Icon name="bolt" /></span>Nudge</button>
      </div>

      {openEsc.length > 0 && (
        <Section title="Needs you">
          <Group>
            {openEsc.map((e) => (
              <Row
                key={e.id}
                lead={<span className={`sdot ${e.urgency === "urgent" ? "red" : "amber"}`} />}
                title={e.summary}
                meta={`${e.urgency === "urgent" ? "Urgent · " : ""}${ESC_LABEL[e.category] || e.category} · ${timeAgo(e.createdAt)}`}
                trail={<button className="btn sm primary" onClick={async () => { await patch(`/team/escalations/${e.id}`, { status: "resolved" }); load(); }}>Resolve</button>}
              />
            ))}
          </Group>
        </Section>
      )}

      <div className="tabs" role="tablist">
        {TABS.map((t) => <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Chat" && <ChatTab d={d} reload={load} />}
      {tab === "Edits" && <EditsTab d={d} reload={load} />}
      {tab === "Leads" && (
        <Section title={`Leads · ${d.leads.length}`}>
          {d.leads.length === 0 ? <div className="empty">No leads yet. They show up here once the lead form is on their site.</div> : (
            <Group>
              {d.leads.map((l) => (
                <Row
                  key={l.id}
                  title={l.name || l.phone || l.email}
                  meta={`${timeAgo(l.createdAt)} · ${l.source}${l.message ? ` · ${l.message}` : ""}`}
                  trail={<span className={`pill ${LEAD_STATUS[l.status][1]}`}>{LEAD_STATUS[l.status][0]}</span>}
                />
              ))}
            </Group>
          )}
        </Section>
      )}
      {tab === "Upsell" && <UpsellTab d={d} reload={load} />}
      {tab === "Site" && <SiteTab d={d} />}
      {tab === "Referrals" && <ReferralsTab d={d} reload={load} />}
      {tab === "Account" && (
        <>
          <Section title="Business details">
            <div className="group" style={{ padding: 16 }}>
              <ClientForm
                initial={{ ...c, goLiveDate: c.goLiveDate || "" }}
                submitLabel="Save changes"
                onSubmit={async (v) => { await patch(`/team/clients/${c.id}`, v); toast("Saved", c.status !== v.status && v.status === "live" ? "Client was buzzed: site is live + referral ask." : undefined, "revision_done"); load(); }}
              />
            </div>
          </Section>
          <LoginsCard d={d} reload={load} />
          <Section title="Lead form for their site">
            <p className="small muted">Point the site's contact form here. Every submission lands in their Leads tab and buzzes their phone. Fields: name, phone, email, message.</p>
            <LeadFormSnippet origin={info?.appUrl || location.origin} siteKey={c.siteKey} siteUrl={c.siteUrl} />
          </Section>
          <DeleteClient name={c.businessName} onDelete={async () => { await del(`/team/clients/${c.id}`); nav("/team/clients"); }} />
        </>
      )}
    </Page>
  );
}

// Two-step delete built into the page (works everywhere, unlike browser confirm popups)
function DeleteClient({ name, onDelete }: { name: string; onDelete: () => Promise<void> }) {
  const [armed, setArmed] = useState(false);
  return armed ? (
    <div className="group" style={{ padding: 16 }}>
      <p className="small" style={{ marginBottom: 12 }}>Delete <b>{name}</b> and all their leads, edits, chats and logins? This can't be undone.</p>
      <div className="btn-row">
        <button className="btn primary grow" style={{ background: "var(--red)", borderColor: "var(--red)" }} onClick={onDelete}>Delete forever</button>
        <button className="btn" onClick={() => setArmed(false)}>Cancel</button>
      </div>
    </div>
  ) : (
    <button className="btn block" style={{ color: "var(--red-text)" }} onClick={() => setArmed(true)}>Delete client</button>
  );
}

function ChatTab({ d, reload }: { d: Detail; reload: () => void }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "nearest" }); }, [d.chat.length]);
  return (
    <Section title="Conversation">
      <div className="group chat" style={{ maxHeight: 460, overflowY: "auto", padding: 12 }}>
        {d.chat.length === 0 && <div className="sys">No messages yet. When {d.client.ownerName.split(" ")[0]} messages the assistant, it shows up here.</div>}
        {d.chat.map((m) =>
          m.sender === "system" ? <div key={m.id} className="sys">{/^(Sent to Cam|Flagged as urgent)/.test(m.body) ? `Escalated to the team${m.body.startsWith("Flagged") ? " (urgent)" : ""}` : m.body}</div> : (
            <div key={m.id} className={`bubble ${m.sender === "team" ? "me" : m.sender === "client" ? "team" : "them"}`}>
              <div className="who" style={m.sender === "team" ? { color: "inherit", opacity: 0.7 } : undefined}>{m.sender === "bot" ? "Assistant" : m.authorName} · {timeAgo(m.createdAt)}</div>
              {m.body}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
      <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await post(`/team/clients/${d.client.id}/chat`, { body: text }); setText(""); reload(); }}>
        <input className="grow" placeholder={`Reply to ${d.client.ownerName.split(" ")[0]}…`} value={text} onChange={(e) => setText(e.target.value)} aria-label="Reply" />
        <button className="send" aria-label="Send" disabled={!text.trim()}><Icon name="send" size={18} /></button>
      </form>
    </Section>
  );
}

function EditsTab({ d, reload }: { d: Detail; reload: () => void }) {
  const [title, setTitle] = useState("");
  const set = async (id: number, status: string) => { await patch(`/team/revisions/${id}`, { status }); reload(); };
  return (
    <Section title="Edits">
      <form className="row" onSubmit={async (e) => { e.preventDefault(); await post(`/team/clients/${d.client.id}/revisions`, { title, details: title }); setTitle(""); reload(); }}>
        <input className="grow" placeholder="Log an edit" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} aria-label="New edit" />
        <button className="btn primary">Add</button>
      </form>
      {d.revisions.length === 0 ? <div className="empty">No edits yet.</div> : (
        <Group>
          {d.revisions.map((r) => (
            <Row
              key={r.id}
              title={r.title}
              meta={`${r.status === "done" ? `Done ${timeAgo(r.completedAt || r.createdAt)}` : new Date(r.dueAt).getTime() < Date.now() ? "Overdue" : dueLabel(r.dueAt)} · from ${BY[r.createdBy] || r.createdBy}${r.details !== r.title ? ` · ${r.details}` : ""}`}
              trail={r.status === "done" ? <span className="pill">Live</span> : (
                <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                  {r.status === "open" && <button className="btn sm" onClick={() => set(r.id, "in_progress")}>Start</button>}
                  <button className="btn sm primary" onClick={() => set(r.id, "done")}>Done</button>
                </div>
              )}
            />
          ))}
        </Group>
      )}
    </Section>
  );
}

function UpsellTab({ d, reload }: { d: Detail; reload: () => void }) {
  const { toast } = useNotifications();
  const up = nextPlan(d.client.tier as Tier);
  const presets = [
    up && { title: `Ready for ${up.name}?`, body: `${up.features[1] || up.features[0]}, plus ${up.revisionLabel.toLowerCase()} edits. Tap to see what changes.`, url: "/plan" },
    { title: "Own every town you serve", body: "We can add a page for each town you cover so you show up first there. Want it?", url: "/plan" },
    { title: "Let's get you more reviews", body: "We'll text your recent customers for Google reviews. One tap to start.", url: "/plan" },
    { title: "Busy season is coming", body: "Want us to run ads so your calendar's full? We handle everything.", url: "/plan" },
    { title: "Know a business owner?", body: "Every business you send us that signs = $100 off your bill. Tap to grab your link.", url: "/refer" },
  ].filter(Boolean) as { title: string; body: string; url: string }[];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const send = async (n: { title: string; body: string; url: string }) => {
    await post(`/team/clients/${d.client.id}/nudge`, n);
    toast("Nudge sent", `${d.client.ownerName}'s phone just buzzed.`, "offer");
  };
  return (
    <>
      <Section title="Their requests">
        {d.upgrades.length === 0 ? <div className="empty">No upgrade requests yet.</div> : (
          <Group>
            {d.upgrades.map((u) => (
              <Row
                key={u.id}
                title={u.label}
                meta={`${u.note ? `${u.note} · ` : ""}${timeAgo(u.createdAt)} · from ${u.source === "chatbot" ? "the assistant" : "the app"}`}
                trail={
                  <select style={selectStyle} value={u.status} aria-label="Request status" onChange={async (e) => { await patch(`/team/upgrades/${u.id}`, { status: e.target.value }); reload(); }}>
                    <option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option>
                  </select>
                }
              />
            ))}
          </Group>
        )}
      </Section>
      <Section title="Buzz them an offer">
        <p className="small muted">Sends a notification straight to {d.client.ownerName}'s phone.</p>
        <Group>
          {presets.map((p) => <Row key={p.title} title={p.title} meta={p.body} onClick={() => send(p)} />)}
        </Group>
        <form className="form group" style={{ padding: 16 }} onSubmit={async (e) => { e.preventDefault(); await send({ title, body, url: "/plan" }); setTitle(""); setBody(""); }}>
          <input placeholder="Custom title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={80} aria-label="Custom title" />
          <input placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required minLength={2} maxLength={200} aria-label="Message" />
          <button className="btn primary">Send custom nudge</button>
        </form>
      </Section>
    </>
  );
}

// Readable, hard-to-guess temporary password
function tempPassword() {
  const words = "spider web silk crimson widow studio granite harbor maple cedar".split(" ");
  const n = new Uint32Array(3);
  crypto.getRandomValues(n);
  return `${words[n[0] % words.length]}-${words[n[1] % words.length]}-${1000 + (n[2] % 9000)}`;
}

function LoginsCard({ d, reload }: { d: Detail; reload: () => void }) {
  const { info } = useMe();
  const [name, setName] = useState(d.client.ownerName);
  const [email, setEmail] = useState(d.client.email || "");
  const [password, setPassword] = useState(() => tempPassword());
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(d.logins.length === 0);
  useEffect(() => { if (d.logins.length === 0) setShowForm(true); }, [d.logins.length]);
  return (
    <Section title="App logins">
      {d.logins.length > 0 ? (
        <Group>
          {d.logins.map((l) => (
            <Row
              key={l.id}
              title={l.name}
              meta={l.email}
              trail={
                <div className="btn-row" style={{ flexWrap: "nowrap" }}>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={async () => {
                      const temp = tempPassword();
                      try { await post(`/team/logins/${l.id}/reset`, { password: temp }); setErr(""); setNotice(`New temporary password for ${l.email}: ${temp}. Text it to them; they can change it under Account.`); } catch (e: any) { setErr(e.message); }
                    }}
                  >Reset password</button>
                  <button type="button" className="btn sm danger" onClick={async () => { await del(`/team/logins/${l.id}`); reload(); }}>Remove</button>
                </div>
              }
            />
          ))}
        </Group>
      ) : (
        <p className="small muted">No login yet. Create one, then text {d.client.ownerName} the email and temporary password.</p>
      )}
      {notice && (
        <div className="banner small" style={{ fontWeight: 500 }}>
          <span className="grow">{notice.split(/(\S+@\S+|\b[a-z]+-[a-z]+-\d{4}\b)/).map((part, i) => (i % 2 ? <code key={i} className="secret">{part}</code> : part))}</span>
          <CopyButton text={notice.replace(/^New temporary password for /, "").replace(/^Login created\. Text [^:]+: /, "")} />
        </div>
      )}
      {showForm ? (
      <form
        className="form group"
        style={{ padding: 16 }}
        onSubmit={async (e) => {
          e.preventDefault();
          setErr("");
          try {
            await post(`/team/clients/${d.client.id}/logins`, { name, email, password });
            setNotice(`Login created. Text ${name}: sign in at ${info?.appUrl || location.origin} with ${email} / ${password}`);
            setPassword(tempPassword());
            setShowForm(false);
            reload();
          } catch (e: any) { setErr(e.message); }
        }}
      >
        <label>Name<input value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label>Temporary password<input value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
        {err && <div className="err">{err}</div>}
        <div className="btn-row">
          <button className="btn primary grow">Create login</button>
          {d.logins.length > 0 && <button type="button" className="btn" onClick={() => setShowForm(false)}>Cancel</button>}
        </div>
      </form>
      ) : (
        <button type="button" className="btn" onClick={() => setShowForm(true)}><Icon name="plus" size={15} /> Add another login</button>
      )}
    </Section>
  );
}

function SiteTab({ d }: { d: Detail }) {
  const w = d.website;
  const { info } = useMe();
  const origin = info?.appUrl || location.origin;
  const snippet = `<script src="${origin}/api/hooks/t/${d.client.siteKey}.js" defer></script>`;
  return (
    <>
      <div className="figures cards">
        <div className="figure"><span className="n">{w.traffic.views}</span><span className="l">Visitors · 30d</span></div>
        <div className="figure"><span className="n">{w.traffic.calls}</span><span className="l">Call taps</span></div>
        <div className="figure"><span className="n">{w.health.uptime != null ? `${w.health.uptime}%` : "—"}</span><span className="l">Uptime</span></div>
      </div>
      <Section title="Tracking snippet">
        <p className="small muted">Paste before <code>&lt;/body&gt;</code> on their site. It counts visits, call, text and email taps, and form sends. {w.tracking ? "Receiving data." : "No data yet."}</p>
        <div className="snippet"><pre className="code">{snippet}</pre><CopyButton text={snippet} label="Copy snippet" /></div>
      </Section>
      <Section title={`Photos from ${d.client.ownerName}`}>
        {w.photos.length === 0 ? <div className="empty">No photos yet.</div> : (
          <div className="thumbs">
            {w.photos.map((p) => <a key={p.id} href={photoSrc(p)} target="_blank" rel="noreferrer"><img src={photoSrc(p)} alt={p.note || "Job photo"} loading="lazy" /></a>)}
          </div>
        )}
      </Section>
    </>
  );
}

function ReferralsTab({ d, reload }: { d: Detail; reload: () => void }) {
  const { toast } = useNotifications();
  const earned = d.referrals.filter((r) => r.status === "signed").reduce((s, r) => s + r.creditAmount, 0);
  const owed = d.referrals.filter((r) => r.creditStatus === "pending").reduce((s, r) => s + r.creditAmount, 0);
  const setStatus = async (r: Referral, status: string) => {
    await patch(`/team/referrals/${r.id}`, { status });
    if (status === "signed") toast("Referral signed", `${d.client.ownerName}'s phone just buzzed with their credit.`, "referral");
    reload();
  };
  return (
    <>
      <div className="figures cards">
        <div className="figure"><span className="n">${earned}</span><span className="l">Earned</span></div>
        <div className="figure"><span className="n" style={{ color: owed ? "var(--red-text)" : undefined }}>${owed}</span><span className="l">Pending</span></div>
        <div className="figure"><span className="n">${earned - owed}</span><span className="l">Applied</span></div>
      </div>
      <Section title="Referrals">
        {d.referrals.length === 0 ? <div className="empty">No referrals yet. Send a "Know a business owner?" nudge from the Upsell tab.</div> : (
          <Group>
            {d.referrals.map((r) => (
              <Row
                key={r.id}
                title={<>{r.name}{r.business ? <span className="muted"> · {r.business}</span> : null}</>}
                meta={`${[formatPhone(r.phone), r.email].filter(Boolean).join(" · ") || "No contact info"} · ${r.source === "link" ? "used their link" : "added in the app"} · ${timeAgo(r.createdAt)}${r.status === "signed" ? ` · +$${r.creditAmount} credit` : ""}`}
                trail={
                  r.status !== "signed" ? (
                    <select style={selectStyle} value={r.status} aria-label="Referral status" onChange={(e) => setStatus(r, e.target.value)}>
                      <option value="new">New</option><option value="contacted">Talking</option><option value="signed">Signed</option><option value="lost">Lost</option>
                    </select>
                  ) : r.creditStatus === "pending" ? (
                    <button className="btn sm primary" onClick={async () => { await patch(`/team/referrals/${r.id}/credit`, {}); reload(); }}>Mark ${r.creditAmount} applied</button>
                  ) : <span className="pill green">Paid</span>
                }
              />
            ))}
          </Group>
        )}
      </Section>
    </>
  );
}

function LeadFormSnippet({ origin, siteKey, siteUrl }: { origin: string; siteKey: string; siteUrl: string | null }) {
  const html = `<form action="${origin}/api/hooks/lead/${siteKey}" method="POST">
  <input name="name"> <input name="phone"> <input name="email">
  <textarea name="message"></textarea>
  <input name="_gotcha" style="display:none">
  <input type="hidden" name="_redirect" value="https://${(siteUrl || "theirsite.com").replace(/^https?:\/\//, "")}/thanks">
</form>`;
  return <div className="snippet"><pre className="code">{html}</pre><CopyButton text={html} label="Copy form code" /></div>;
}
