import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, patch } from "../api";
import type { Lead, Overview } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { initials, timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  const { toast } = useNotifications();
  useEffect(() => {
    get<{ leads: Lead[] }>("/client/leads").then((r) => setLead(r.leads.find((l) => l.id === Number(id)) || null));
  }, [id]);
  if (!lead) return <main className="main"><div className="empty">Loading…</div></main>;

  const set = async (status: Lead["status"]) => {
    const r = await patch<{ lead: Lead }>(`/client/leads/${lead.id}`, { status });
    setLead(r.lead);
    if (status === "won") toast("Nice work! 🏆", "Another job booked from your website.", "revision_done");
  };
  const tel = lead.phone?.replace(/[^\d+]/g, "");

  return (
    <main className="main">
      <Link to="/leads" className="row small muted" style={{ gap: 4 }}><Icon name="back" size={18} /> Leads</Link>
      <div className="card col" style={{ alignItems: "center", textAlign: "center", gap: 14 }}>
        <div className="avatar lg">{initials(lead.name)}</div>
        <div>
          <h2 style={{ fontSize: 20 }}>{lead.name || "Website lead"}</h2>
          <div className="small muted">{lead.source} · {timeAgo(lead.createdAt)}</div>
        </div>
        <div className="actions">
          <a className="action primary" href={tel ? `tel:${tel}` : undefined} onClick={() => lead.status === "new" && set("contacted")}><span><Icon name="phone" /></span>Call</a>
          <a className="action" href={tel ? `sms:${tel}` : undefined} onClick={() => lead.status === "new" && set("contacted")}><span><Icon name="text" /></span>Text</a>
          <a className="action" href={lead.email ? `mailto:${lead.email}` : undefined}><span><Icon name="mail" /></span>Email</a>
        </div>
      </div>

      {lead.message && (
        <div className="card">
          <div className="meta" style={{ marginBottom: 6 }}>What they said</div>
          <p>{lead.message}</p>
        </div>
      )}

      <div className="card col">
        <div className="meta">Contact</div>
        {lead.phone && <div className="row"><Icon name="phone" size={16} /> {lead.phone}</div>}
        {lead.email && <div className="row"><Icon name="mail" size={16} /> {lead.email}</div>}
      </div>

      <div className="card">
        <div className="meta" style={{ marginBottom: 10 }}>Where does this stand?</div>
        <div className="seg">
          {(["new", "contacted", "won", "lost"] as const).map((s) => (
            <button key={s} className={lead.status === s ? "on" : ""} onClick={() => set(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {lead.status === "won" && o?.reviewUrl && tel && (
        <div className="card col" style={{ gap: 10 }}>
          <h2>⭐ Ask {lead.name?.split(" ")[0] || "them"} for a review</h2>
          <p className="small muted">Happy customers leave reviews when you ask right after the job. One tap sends a text with your Google review link.</p>
          <a
            className="btn primary"
            href={`sms:${tel}?&body=${encodeURIComponent(`Hi ${lead.name?.split(" ")[0] || "there"}, thanks again for choosing ${o.business.replace(/\s*\(.*?\)\s*/g, " ").trim()}! If you have 30 seconds, a quick Google review would mean a lot: ${o.reviewUrl}`)}`}
          >
            <Icon name="star" size={18} /> Text review request
          </a>
        </div>
      )}

      {lead.status === "won" && (
        <Upsell
          soft
          item="reviews"
          eyebrow="Turn this job into a 5-star review"
          title="We'll text your happy customers for Google reviews."
          body="More reviews means you show up first in town. We handle the asking."
          cta="Set up review blasts"
        />
      )}
    </main>
  );
}
