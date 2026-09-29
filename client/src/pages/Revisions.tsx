import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import type { Overview, Revision } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { dueLabel, timeAgo } from "../util";
import { PLANS } from "../../../shared/plans";
import { useNotifications } from "../components/Notifications";

const STATUS: Record<string, [string, string, string]> = { open: ["Queued", "amber", "amber"], in_progress: ["In progress", "green", "green"], done: ["Live", "", ""] };

export default function Revisions() {
  const [revs, setRevs] = useState<Revision[] | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [page, setPage] = useState("");
  const { toast, items } = useNotifications();

  const load = () => get<{ revisions: Revision[] }>("/client/revisions").then((r) => setRevs(r.revisions));
  useEffect(() => { load(); }, [items[0]?.id]);
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await post("/client/revisions", { title, details, page: page || null });
    setTitle(""); setDetails(""); setPage(""); setForm(false);
    toast("Edit requested ✅", `We'll buzz you when it's live (${o?.plan.revisionTurnaround.toLowerCase()} turnaround).`, "revision_update");
    load();
  };

  return (
    <main className="main">
      <div style={{ padding: "10px 2px 0" }}>
        <h1>Edits</h1>
        <p className="muted small" style={{ marginTop: 4 }}>Unlimited, included in your plan. Ask here or just tell the <Link to="/help" className="accent">assistant</Link>.</p>
      </div>

      {o && (
        <div className="card">
          <div className="card-head" style={{ marginBottom: 8 }}>
            <h2>Your turnaround: <span className="accent">{o.plan.revisionTurnaround}</span></h2>
          </div>
          <div className="ladder">
            {[1, 2, 3, 4].map((t) => (
              <div key={t} className={t === o.plan.tier ? "me" : t === o.plan.tier + 1 ? "up" : ""} style={{ minHeight: 44 + t * 12 }}>
                <b>{PLANS[t as 1].revisionLabel}</b>
                <span style={{ opacity: 0.75, fontWeight: 500 }}>{PLANS[t as 1].name}</span>
              </div>
            ))}
          </div>
          {o.nextPlan && <p className="small muted" style={{ marginTop: 10 }}>Need it faster? <Link to="/plan" className="accent" style={{ fontWeight: 600 }}>{o.nextPlan.name} gets {o.nextPlan.revisionTurnaround.toLowerCase()} edits →</Link></p>}
        </div>
      )}

      {form ? (
        <form className="card form" onSubmit={submit}>
          <h2>Request an edit</h2>
          <label>What should change?<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Update Saturday hours" required minLength={3} /></label>
          <label>Details<textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Exact wording, what to replace, where photos are coming from…" required minLength={3} /></label>
          <label>Page (optional)<input value={page} onChange={(e) => setPage(e.target.value)} placeholder="Home, Services, Contact…" /></label>
          <div className="btn-row">
            <button className="btn primary grow">Send to the team</button>
            <button type="button" className="btn ghost" onClick={() => setForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn primary block" onClick={() => setForm(true)}><Icon name="plus" size={18} /> Request an edit</button>
      )}

      <div className="card">
        {!revs ? <div className="empty">Loading…</div> : revs.length === 0 ? <div className="empty">No edits yet.</div> : (
          <div className="list">
            {revs.map((r) => (
              <div key={r.id} className="item">
                <div className={`bar ${STATUS[r.status][2]}`} />
                <div className="grow">
                  <div className="meta">{r.status === "done" ? `Done ${timeAgo(r.completedAt || r.createdAt)}` : <b>{dueLabel(r.dueAt)}</b>}{r.page ? ` · ${r.page}` : ""}</div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div className="small muted ellipsis">{r.details}</div>
                </div>
                <span className={`pill ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <Upsell
        soft
        item="extra-page"
        eyebrow="Add-on"
        title="Want a page for each town you serve?"
        body="Town and service pages help you show up when customers search for what you do in every town you cover."
        cta="Add pages"
      />
    </main>
  );
}
