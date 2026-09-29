import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../api";
import type { Client } from "../../types";
import { PLANS, type Tier } from "../../../../shared/plans";

const STATUS: Record<string, [string, string]> = { build: ["Building", "amber"], phase1: ["Phase 1", "amber"], live: ["Live", "green"] };

export default function Clients() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { get<{ clients: Client[] }>("/team/clients").then((r) => setClients(r.clients)); }, []);
  const shown = (clients || []).filter((c) => `${c.businessName} ${c.ownerName} ${c.niche}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="main wide">
      <div className="page-head row">
        <h1 className="grow">Clients</h1>
        <Link to="/team/new" className="btn sm">New</Link>
      </div>
      <input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
      {!clients ? <div className="empty">Loading…</div> : shown.length === 0 ? <div className="empty">No clients yet.</div> : (
        <div className="list">
          {shown.map((c) => (
            <Link key={c.id} to={`/team/clients/${c.id}`} className="item">
              <span className={`sdot ${c.openEscalations ? "red" : c.status === "live" ? "green" : "amber"}`} />
              <div className="grow">
                <div className="title">{c.businessName}</div>
                <div className="meta">{PLANS[c.tier as Tier].name} · {STATUS[c.status][0]} · {c.leads30} leads/30d{c.openRevisions ? ` · ${c.openRevisions} edits` : ""}</div>
              </div>
              {!!c.openEscalations && <span className="pill red">{c.openEscalations}</span>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
