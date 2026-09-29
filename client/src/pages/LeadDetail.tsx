import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, patch } from "../api";
import type { Lead, Overview } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const { toast } = useNotifications();
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  useEffect(() => {
    get<{ leads: Lead[] }>("/client/leads").then((r) => setLead(r.leads.find((l) => l.id === Number(id)) || null));
  }, [id]);
  if (!lead) return <main className="main"><div className="empty">Loading…</div></main>;

  const set = async (status: Lead["status"]) => {
    const r = await patch<{ lead: Lead }>(`/client/leads/${lead.id}`, { status });
    setLead(r.lead);
    if (status === "won") toast("Nice work", "Another job booked from your website.", "revision_done");
  };
  const tel = lead.phone?.replace(/[^\d+]/g, "");
  const first = lead.name?.split(" ")[0] || "there";
  const biz = o?.business.replace(/\s*\(.*?\)\s*/g, " ").trim();

  return (
    <main className="main">
      <Link to="/leads" className="row small muted" style={{ gap: 4 }}><Icon name="back" size={16} /> Leads</Link>
      <div className="page-head">
        <h1>{lead.name || "Website lead"}</h1>
        <p className="muted small">{lead.source} · {timeAgo(lead.createdAt)}</p>
      </div>

      <div className="actions" style={{ justifyContent: "flex-start" }}>
        <a className="action primary" href={tel ? `tel:${tel}` : undefined} onClick={() => lead.status === "new" && set("contacted")}><span><Icon name="phone" /></span>Call</a>
        <a className="action" href={tel ? `sms:${tel}` : undefined} onClick={() => lead.status === "new" && set("contacted")}><span><Icon name="text" /></span>Text</a>
        <a className="action" href={lead.email ? `mailto:${lead.email}` : undefined}><span><Icon name="mail" /></span>Email</a>
      </div>

      {lead.message && <p style={{ fontSize: 17, lineHeight: 1.5 }}>“{lead.message}”</p>}

      <div className="list">
        {lead.phone && <div className="item"><span className="grow">{lead.phone}</span><span className="meta">Phone</span></div>}
        {lead.email && <div className="item"><span className="grow ellipsis">{lead.email}</span><span className="meta">Email</span></div>}
      </div>

      <div className="section">
        <span className="label">Status</span>
        <div className="seg">
          {(["new", "contacted", "won", "lost"] as const).map((s) => (
            <button key={s} className={lead.status === s ? "on" : ""} onClick={() => set(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </div>

      {lead.status === "won" && o?.reviewUrl && tel && (
        <a
          className="btn block"
          href={`sms:${tel}?&body=${encodeURIComponent(`Hi ${first}, thanks again for choosing ${biz}! If you have 30 seconds, a quick Google review would mean a lot: ${o.reviewUrl}`)}`}
        >
          <Icon name="star" size={17} /> Ask {first} for a review
        </a>
      )}
      {lead.status === "won" && !o?.reviewUrl && (
        <Upsell item="reviews" title="Turn happy customers into reviews" body="We text your customers for Google reviews." cta="Set up" />
      )}
    </main>
  );
}
