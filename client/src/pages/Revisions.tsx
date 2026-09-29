import { RevealText } from "../components/Motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import type { Overview, Revision } from "../types";
import { Icon } from "../components/Icon";
import { dueLabel, timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";

const STATUS: Record<string, [string, string]> = { open: ["Queued", "amber"], in_progress: ["In progress", "green"], done: ["Live", ""] };

export default function Revisions() {
  const [revs, setRevs] = useState<Revision[] | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [form, setForm] = useState(false);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const { toast, items } = useNotifications();

  const load = () => get<{ revisions: Revision[] }>("/client/revisions").then((r) => setRevs(r.revisions));
  useEffect(() => { load(); }, [items[0]?.id]);
  useEffect(() => { get<Overview>("/client/overview").then(setO); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await post("/client/revisions", { title, details, page: null });
    setTitle(""); setDetails(""); setForm(false);
    toast("Edit requested", "We'll buzz you when it's live.", "revision_update");
    load();
  };

  return (
    <main className="main">
      <Link to="/website" className="row small muted" style={{ gap: 4 }}><Icon name="back" size={16} /> Website</Link>
      <div className="page-head">
        <h1><RevealText text="Edits" /></h1>
        {o && (
          <p className="muted small">
            Unlimited on your plan, done within {o.plan.revisionTurnaround.toLowerCase()}.
            {o.nextPlan && <> <Link to="/plan" style={{ color: "var(--text)", fontWeight: 500 }}>{o.nextPlan.revisionTurnaround} with {o.nextPlan.name} →</Link></>}
          </p>
        )}
      </div>

      {form ? (
        <form className="form" onSubmit={submit}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What should change?" required minLength={3} autoFocus />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details: exact wording, which page, where photos are coming from" required minLength={3} />
          <div className="btn-row">
            <button className="btn primary grow">Send</button>
            <button type="button" className="btn ghost" onClick={() => setForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn primary block" onClick={() => setForm(true)}>Request an edit</button>
      )}

      {!revs ? <div className="empty">Loading…</div> : revs.length === 0 ? <div className="empty">No edits yet.</div> : (
        <div className="list">
          {revs.map((r) => (
            <div key={r.id} className="item">
              <div className="grow">
                <div className="title">{r.title}</div>
                <div className="meta">{r.status === "done" ? `Done ${timeAgo(r.completedAt || r.createdAt)}` : dueLabel(r.dueAt)}</div>
              </div>
              <span className={`pill ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
