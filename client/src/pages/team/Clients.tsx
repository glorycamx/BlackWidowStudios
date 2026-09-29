import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../../api";
import type { Client } from "../../types";
import { PLANS, type Tier } from "../../../../shared/plans";
import { initials } from "../../util";

const STATUS: Record<string, [string, string]> = { build: ["Building", "amber"], phase1: ["Phase 1", "amber"], live: ["Live", "green"] };

export default function Clients() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { get<{ clients: Client[] }>("/team/clients").then((r) => setClients(r.clients)); }, []);
  const shown = (clients || []).filter((c) => `${c.businessName} ${c.ownerName} ${c.niche}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <main className="main wide">
      <div className="row" style={{ padding: "10px 2px 0" }}>
        <h1 className="grow">Clients</h1>
        <Link to="/team/new" className="btn primary sm">+ New</Link>
      </div>
      <input placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="card">
        {!clients ? <div className="empty">Loading…</div> : shown.length === 0 ? <div className="empty">No clients yet.</div> : (
          <div className="list">
            {shown.map((c) => (
              <Link key={c.id} to={`/team/clients/${c.id}`} className="item" style={{ alignItems: "center" }}>
                <div className="avatar">{initials(c.businessName)}</div>
                <div className="grow">
                  <div style={{ fontWeight: 600 }}>{c.businessName}</div>
                  <div className="small muted">{c.ownerName} · {PLANS[c.tier as Tier].name} · {c.leads30} leads/30d</div>
                </div>
                <div className="col" style={{ alignItems: "flex-end", gap: 4 }}>
                  <span className={`pill ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
                  {!!c.openEscalations && <span className="pill red">{c.openEscalations} needs you</span>}
                  {!!c.openRevisions && <span className="pill">{c.openRevisions} edits</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
