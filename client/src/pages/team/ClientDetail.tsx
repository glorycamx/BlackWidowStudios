import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { del, get, patch, post } from "../../api";
import type { ChatMessage, Client, Escalation, Lead, Referral, Revision, Upgrade, WebsiteStats } from "../../types";
import { photoSrc } from "../../photos";
import { Icon } from "../../components/Icon";
import { useNotifications } from "../../components/Notifications";
import { PLANS, nextPlan, type Tier } from "../../../../shared/plans";
import { dueLabel, timeAgo } from "../../util";
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

export default function ClientDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [d, setD] = useState<Detail | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Chat");
  const { items, toast } = useNotifications();
  const load = () => get<Detail>(`/team/clients/${id}`).then(setD);
  useEffect(() => { load(); }, [id, items[0]?.id]);
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, [id]);
  if (!d) return <main className="main wide"><div className="empty">Loading…</div></main>;

  const c = d.client;
  const plan = PLANS[c.tier as Tier];
  const openEsc = d.escalations.filter((e) => e.status === "open");
  const tel = c.phone?.replace(/[^\d+]/g, "");

  return (
    <main className="main">
      <Link to="/team/clients" className="row small muted" style={{ gap: 4 }}><Icon name="back" size={18} /> Clients</Link>
      <div className="page-head">
        <h1>{c.businessName}</h1>
        <p className="muted small">{c.ownerName} · {plan.name} (${plan.monthly}/mo) · {c.status === "live" ? "Live" : c.status === "phase1" ? "Phase 1" : "Building"}</p>
      </div>
      <div className="actions" style={{ justifyContent: "flex-start" }}>
        <a className="action primary" href={tel ? `tel:${tel}` : undefined}><span><Icon name="phone" /></span>Call</a>
        <a className="action" href={tel ? `sms:${tel}` : undefined}><span><Icon name="text" /></span>Text</a>
        <a className="action" href={c.email ? `mailto:${c.email}` : undefined}><span><Icon name="mail" /></span>Email</a>
        <button className="action" onClick={() => setTab("Upsell")}><span><Icon name="bolt" /></span>Nudge</button>
      </div>

      {openEsc.map((e) => (
        <div key={e.id} className="banner">
          <span className={`sdot ${e.urgency === "urgent" ? "red" : "amber"}`} />
          <div className="grow"><div className="small" style={{ fontWeight: 600 }}>{e.summary}</div><div className="tiny muted">{timeAgo(e.createdAt)} · {e.category}</div></div>
          <button className="btn sm" onClick={async () => { await patch(`/team/escalations/${e.id}`, { status: "resolved" }); load(); }}>Resolve</button>
        </div>
      ))}

      <div className="tabs">
        {TABS.map((t) => <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Chat" && <ChatTab d={d} reload={load} />}
      {tab === "Edits" && <EditsTab d={d} reload={load} />}
      {tab === "Leads" && (
        <div className="section">
          {d.leads.length === 0 ? <div className="empty">No leads yet.</div> : (
            <div className="list">
              {d.leads.map((l) => (
                <div key={l.id} className="item">
                  <div className="grow">
                    <div className="meta">{timeAgo(l.createdAt)} · {l.source} · {l.status}</div>
                    <div style={{ fontWeight: 600 }}>{l.name || l.phone || l.email}</div>
                    {l.message && <div className="small muted">{l.message}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {tab === "Upsell" && <UpsellTab d={d} reload={load} />}
      {tab === "Site" && <SiteTab d={d} />}
      {tab === "Referrals" && <ReferralsTab d={d} reload={load} />}
      {tab === "Account" && (
        <div className="stack">
          <div className="section">
            <ClientForm
              initial={{ ...c, goLiveDate: c.goLiveDate || "" }}
              submitLabel="Save"
              onSubmit={async (v) => { await patch(`/team/clients/${c.id}`, v); toast("Saved", c.status !== v.status && v.status === "live" ? "Client was buzzed: site is live + referral ask." : undefined, "revision_done"); load(); }}
            />
          </div>
          <LoginsCard d={d} reload={load} />
          <div className="section">
            <h2>Lead form hookup</h2>
            <p className="small muted">Point the site's contact form here. Every submission lands in their Leads tab and buzzes their phone. Fields: name, phone, email, message.</p>
            <pre className="code">
{`<form action="${location.origin}/api/hooks/lead/${c.siteKey}" method="POST">
  <input name="name"> <input name="phone"> <input name="email">
  <textarea name="message"></textarea>
  <input name="_gotcha" style="display:none">
  <input type="hidden" name="_redirect" value="https://${c.siteUrl || "theirsite.com"}/thanks">
</form>`}
            </pre>
          </div>
          <button className="btn ghost" style={{ color: "var(--red-text)" }} onClick={async () => { if (confirm(`Delete ${c.businessName} and all their data?`)) { await del(`/team/clients/${c.id}`); nav("/team/clients"); } }}>Delete client</button>
        </div>
      )}
    </main>
  );
}

function ChatTab({ d, reload }: { d: Detail; reload: () => void }) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView(); }, [d.chat.length]);
  return (
    <div className="section">
      <div className="chat" style={{ maxHeight: 460, overflowY: "auto", padding: 2 }}>
        {d.chat.length === 0 && <div className="empty">No messages yet.</div>}
        {d.chat.map((m) =>
          m.sender === "system" ? <div key={m.id} className="sys">{m.body}</div> : (
            <div key={m.id} className={`bubble ${m.sender === "team" ? "me" : m.sender === "client" ? "team" : "them"}`}>
              <div className="who" style={m.sender === "team" ? { color: "rgba(255,255,255,.7)" } : undefined}>{m.sender === "bot" ? "Assistant" : m.authorName} · {timeAgo(m.createdAt)}</div>
              {m.body}
            </div>
          ),
        )}
        <div ref={endRef} />
      </div>
      <form className="row" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await post(`/team/clients/${d.client.id}/chat`, { body: text }); setText(""); reload(); }}>
        <input placeholder={`Reply to ${d.client.ownerName} (buzzes their phone)`} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="send" aria-label="Send"><Icon name="send" size={18} /></button>
      </form>
    </div>
  );
}

function EditsTab({ d, reload }: { d: Detail; reload: () => void }) {
  const [title, setTitle] = useState("");
  const set = async (id: number, status: string) => { await patch(`/team/revisions/${id}`, { status }); reload(); };
  return (
    <div className="stack">
      <form className="row" onSubmit={async (e) => { e.preventDefault(); await post(`/team/clients/${d.client.id}/revisions`, { title, details: title }); setTitle(""); reload(); }}>
        <input placeholder="Log an edit (e.g. from a phone call)" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} />
        <button className="btn primary sm">Add</button>
      </form>
      <div className="section">
        {d.revisions.length === 0 ? <div className="empty">No edits.</div> : (
          <div className="list">
            {d.revisions.map((r) => (
              <div key={r.id} className="item">
                <div className="grow">
                  <div className="meta">{r.status === "done" ? `Done ${timeAgo(r.completedAt || r.createdAt)}` : <b>{dueLabel(r.dueAt)}</b>} · by {r.createdBy}{r.page ? ` · ${r.page}` : ""}</div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  {r.details !== r.title && <div className="small muted">{r.details}</div>}
                </div>
                {r.status !== "done" && (
                  <div className="col" style={{ gap: 6 }}>
                    {r.status === "open" && <button className="btn sm" onClick={() => set(r.id, "in_progress")}>Start</button>}
                    <button className="btn sm primary" onClick={() => set(r.id, "done")}>Done</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UpsellTab({ d, reload }: { d: Detail; reload: () => void }) {
  const { toast } = useNotifications();
  const up = nextPlan(d.client.tier as Tier);
  const presets = [
    up && { title: `Ready for ${up.name}? 🚀`, body: `${up.revisionLabel} edits plus ${up.features[1]?.toLowerCase()}. Tap to see what changes.`, url: "/plan" },
    { title: "📍 Own every town you serve", body: "We can add a page for each town you cover so you show up first there. Want it?", url: "/plan" },
    { title: "⭐ Let's get you more reviews", body: "We'll text your recent customers for Google reviews. One tap to start.", url: "/plan" },
    { title: "📣 Busy season is coming", body: "Want us to run ads so your calendar's full? We handle everything.", url: "/plan" },
    { title: "💸 Know a business owner?", body: "Every business you send us that signs = $100 off your bill. Tap to grab your link.", url: "/refer" },
  ].filter(Boolean) as { title: string; body: string; url: string }[];
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const send = async (n: { title: string; body: string; url: string }) => {
    await post(`/team/clients/${d.client.id}/nudge`, n);
    toast("Nudge sent", `${d.client.ownerName}'s phone just buzzed.`, "offer");
  };
  return (
    <div className="stack">
      <div className="section">
        <span className="label">Their requests</span>
        {d.upgrades.length === 0 ? <div className="empty">No upgrade requests yet.</div> : (
          <div className="list">
            {d.upgrades.map((u) => (
              <div key={u.id} className="item" style={{ alignItems: "center" }}>
                <div className="grow"><div style={{ fontWeight: 600 }}>{u.label}</div><div className="small muted">{u.note} · {timeAgo(u.createdAt)} via {u.source}</div></div>
                <select style={{ width: 118, padding: "6px 8px", fontSize: 13 }} value={u.status} onChange={async (e) => { await patch(`/team/upgrades/${u.id}`, { status: e.target.value }); reload(); }}>
                  <option value="new">New</option><option value="contacted">Contacted</option><option value="won">Won</option><option value="lost">Lost</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="section">
        <h2>Buzz them an offer</h2>
        <p className="small muted">Sends a push notification straight to {d.client.ownerName}'s phone.</p>
        {presets.map((p) => (
          <button key={p.title} className="item" style={{ background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", width: "100%" }} onClick={() => send(p)}>
            <div className="grow"><div className="title">{p.title}</div><div className="small muted">{p.body}</div></div>
            <Icon name="send" size={18} />
          </button>
        ))}
        <form className="form" onSubmit={async (e) => { e.preventDefault(); await send({ title, body, url: "/plan" }); setTitle(""); setBody(""); }}>
          <input placeholder="Custom title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} maxLength={80} />
          <input placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} required minLength={2} maxLength={200} />
          <button className="btn primary">Send custom nudge</button>
        </form>
      </div>
    </div>
  );
}

function LoginsCard({ d, reload }: { d: Detail; reload: () => void }) {
  const [name, setName] = useState(d.client.ownerName);
  const [email, setEmail] = useState(d.client.email || "");
  const [password, setPassword] = useState(() => Math.random().toString(36).slice(2, 10) + "A1");
  const [err, setErr] = useState("");
  return (
    <div className="section">
      <h2>App logins</h2>
      {d.logins.map((l) => <div key={l.id} className="small">{l.name} · {l.email}</div>)}
      {d.logins.length === 0 && <p className="small muted">No login yet. Create one and text it to them.</p>}
      <form className="form" onSubmit={async (e) => { e.preventDefault(); setErr(""); try { await post(`/team/clients/${d.client.id}/logins`, { name, email, password }); reload(); } catch (e: any) { setErr(e.message); } }}>
        <div className="figures">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Temp password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {err && <div className="err">{err}</div>}
        <button className="btn">Create login</button>
      </form>
    </div>
  );
}

function SiteTab({ d }: { d: Detail }) {
  const w = d.website;
  const snippet = `<script src="${location.origin}/api/hooks/t/${d.client.siteKey}.js" defer></script>`;
  return (
    <div className="stack">
      <div className="figures">
        <div className="figure"><span className="n">{w.traffic.views}</span><span className="l">Visitors 30d</span></div>
        <div className="figure"><span className="n">{w.traffic.calls}</span><span className="l">Call taps</span></div>
        <div className="figure"><span className="n">{w.health.uptime != null ? `${w.health.uptime}%` : "—"}</span><span className="l">Uptime</span></div>
      </div>
      <div className="section">
        <h2>Tracking snippet</h2>
        <p className="small muted">Paste before <code>&lt;/body&gt;</code> on their site. It counts visits, call/text/email taps and form sends{w.tracking ? " (receiving data ✅)" : " (no data yet)"}.</p>
        <pre className="code">{snippet}</pre>
      </div>
      <div className="section">
        <h2>Photos from {d.client.ownerName}</h2>
        {w.photos.length === 0 ? <div className="empty">No photos yet.</div> : (
          <div className="thumbs">
            {w.photos.map((p) => <a key={p.id} href={photoSrc(p)} target="_blank" rel="noreferrer"><img src={photoSrc(p)} alt={p.note || "Job photo"} loading="lazy" /></a>)}
          </div>
        )}
      </div>
    </div>
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
    <div className="stack">
      <div className="figures">
        <div className="figure"><span className="n">${earned}</span><span className="l">Credit earned</span></div>
        <div className="figure"><span className="n" style={{ color: owed ? "var(--red-text)" : undefined }}>${owed}</span><span className="l">Owed on next bill</span></div>
      </div>
      <div className="section">
        {d.referrals.length === 0 ? <div className="empty">No referrals yet. Buzz them a nudge from the Upsell tab.</div> : (
          <div className="list">
            {d.referrals.map((r) => (
              <div key={r.id} className="item">
                <div className="grow">
                  <div className="meta">{timeAgo(r.createdAt)} · {r.source === "link" ? "via share link" : "added in app"}</div>
                  <div style={{ fontWeight: 600 }}>{r.name}{r.business ? ` · ${r.business}` : ""}</div>
                  <div className="small">{r.phone && <a className="accent" href={`tel:${r.phone}`}>{r.phone}</a>} {r.email}</div>
                  {r.status === "signed" && <div className="small muted">+${r.creditAmount} credit · {r.creditStatus === "applied" ? "applied ✓" : "not applied yet"}</div>}
                </div>
                <div className="col" style={{ gap: 6, alignItems: "flex-end" }}>
                  {r.status !== "signed" ? (
                    <select style={{ width: 118, padding: "6px 8px", fontSize: 13 }} value={r.status} onChange={(e) => setStatus(r, e.target.value)}>
                      <option value="new">New</option><option value="contacted">Talking</option><option value="signed">Signed</option><option value="lost">Lost</option>
                    </select>
                  ) : r.creditStatus === "pending" ? (
                    <button className="btn sm primary" onClick={async () => { await patch(`/team/referrals/${r.id}/credit`, {}); reload(); }}>Mark ${r.creditAmount} applied</button>
                  ) : <span className="pill green">Paid</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
