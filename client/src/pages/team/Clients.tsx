import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../api";
import type { Client } from "../../types";
import { PLANS, type Tier } from "../../../../shared/plans";
import { Group, Page, Row } from "../../components/Page";
import { Icon } from "../../components/Icon";

const STATUS: Record<string, string> = { build: "Building", phase1: "Phase 1", live: "Live" };

export default function Clients() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { get<{ clients: Client[] }>("/team/clients").then((r) => setClients(r.clients)); }, []);
  const shown = (clients || []).filter((c) => `${c.businessName} ${c.ownerName} ${c.niche}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <Page page="clients" wide blurb={clients ? `${clients.length} ${clients.length === 1 ? "business" : "businesses"} on Black Widow` : undefined}>
      <div className="row">
        <input className="grow" placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" />
        <Link to="/team/new" className="btn primary"><Icon name="plus" size={16} /> New</Link>
      </div>
      {!clients ? <div className="empty">Loading…</div> : shown.length === 0 ? (
        clients.length === 0
          ? <div className="empty">No clients yet. Add your first one and create their login.<br /><Link to="/team/new" className="btn primary sm">New client</Link></div>
          : <div className="empty">No clients match "{q}".</div>
      ) : (
        <Group>
          {shown.map((c) => (
            <Row
              key={c.id}
              to={`/team/clients/${c.id}`}
              lead={<span className={`sdot ${c.openEscalations ? "red" : c.status === "live" ? "green" : "amber"}`} />}
              title={c.businessName}
              meta={`${PLANS[c.tier as Tier].name} · ${STATUS[c.status]} · ${c.leads30} leads/30d${c.openRevisions ? ` · ${c.openRevisions} edits` : ""}`}
              trail={c.openEscalations ? <span className="pill red">{c.openEscalations} need you</span> : undefined}
            />
          ))}
        </Group>
      )}
    </Page>
  );
}
