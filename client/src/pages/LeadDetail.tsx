import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { get, patch } from "../api";
import type { Lead, Overview } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { formatPhone, timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";
import { celebrate } from "../motion";
import { Group, Page, Row, Section } from "../components/Page";

export default function LeadDetail() {
  const { id } = useParams();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const { toast } = useNotifications();
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);
  useEffect(() => { get<{ leads: Lead[] }>("/client/leads").then((r) => setLeads(r.leads)); }, []);
  const back = { to: "/leads", label: "Leads" };
  const idx = leads ? leads.findIndex((l) => l.id === Number(id)) : -1;
  const lead = leads && idx >= 0 ? leads[idx] : null;
  if (!lead) return <Page page="lead" back={back}><div className="empty">{leads ? "Lead not found." : "Loading…"}</div></Page>;

  const prev = idx > 0 ? leads![idx - 1] : null;
  const next = idx < leads!.length - 1 ? leads![idx + 1] : null;
  const set = async (status: Lead["status"]) => {
    const r = await patch<{ lead: Lead }>(`/client/leads/${lead.id}`, { status });
    setLeads((ls) => ls!.map((l) => (l.id === r.lead.id ? r.lead : l)));
    if (status === "won") { celebrate(); toast("Nice work", "Another job booked from your website.", "revision_done"); }
  };
  const tel = lead.phone?.replace(/[^\d+]/g, "");
  const first = lead.name?.split(" ")[0] || "there";
  const biz = o?.business.replace(/\s*\(.*?\)\s*/g, " ").trim();

  return (
    <Page page="lead" back={back} heading={lead.name || "Website lead"} blurb={`${lead.source} · ${timeAgo(lead.createdAt)} · lead ${idx + 1} of ${leads!.length}`}>
      <div className="actions" style={{ justifyContent: "flex-start" }}>
        <a className="action primary" href={tel ? `tel:${tel}` : undefined} onClick={() => lead.status === "new" && set("contacted")}><span><Icon name="phone" /></span>Call</a>
        <a className="action" href={tel ? `sms:${tel}` : undefined} onClick={() => lead.status === "new" && set("contacted")}><span><Icon name="text" /></span>Text</a>
        <a className="action" href={lead.email ? `mailto:${lead.email}` : undefined}><span><Icon name="mail" /></span>Email</a>
      </div>

      {lead.message && (
        <Section title="What they said">
          <div className="quote">{lead.message}</div>
        </Section>
      )}

      <Section title="Contact">
        <Group>
          {lead.phone && <Row href={`tel:${tel}`} title={formatPhone(lead.phone)} meta="Phone" />}
          {lead.email && <Row href={`mailto:${lead.email}`} title={lead.email} meta="Email" />}
        </Group>
      </Section>

      <Section title="Where does this stand?">
        <div className="seg">
          {(["new", "contacted", "won", "lost"] as const).map((s) => (
            <button key={s} className={lead.status === s ? "on" : ""} onClick={() => set(s)}>{s[0].toUpperCase() + s.slice(1)}</button>
          ))}
        </div>
      </Section>

      {lead.status === "won" && o?.reviewUrl && tel && (
        <a className="btn primary block" href={`sms:${tel}?&body=${encodeURIComponent(`Hi ${first}, thanks again for choosing ${biz}! If you have 30 seconds, a quick Google review would mean a lot: ${o.reviewUrl}`)}`}>
          <Icon name="star" size={17} /> Ask {first} for a review
        </a>
      )}
      {lead.status === "won" && !o?.reviewUrl && (
        <Upsell item="reviews" title="Turn happy customers into reviews" body="We text your customers for Google reviews." cta="Set up" />
      )}

      <nav className="pager" aria-label="Other leads">
        {prev ? <Link className="btn" to={`/leads/${prev.id}`}><Icon name="back" size={16} /> Previous</Link> : <button className="btn" disabled><Icon name="back" size={16} /> Previous</button>}
        {next ? <Link className="btn" to={`/leads/${next.id}`}>Next <Icon name="forward" size={16} /></Link> : <button className="btn" disabled>Next <Icon name="forward" size={16} /></button>}
      </nav>
    </Page>
  );
}
