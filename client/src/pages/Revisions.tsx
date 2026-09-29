import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import type { Overview, Revision } from "../types";
import { Icon } from "../components/Icon";
import { dueLabel, timeAgo } from "../util";
import { useNotifications } from "../components/Notifications";
import { Group, Page, Row, Section } from "../components/Page";

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
    <Page
      page="edits"
      back={{ to: "/website", label: "Website" }}
      blurb={o ? `Unlimited changes to your site, done within ${o.plan.revisionTurnaround.toLowerCase()}.` : "Unlimited changes to your site."}
    >
      {form ? (
        <form className="form group" style={{ padding: 16 }} onSubmit={submit}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What should change?" required minLength={3} autoFocus />
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Details: exact wording, which page, where photos are coming from" required minLength={3} />
          <div className="btn-row">
            <button className="btn primary grow">Send request</button>
            <button type="button" className="btn" onClick={() => setForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="btn primary block" onClick={() => setForm(true)}><Icon name="plus" size={16} /> Request an edit</button>
      )}

      <Section title="Your edits">
        {!revs ? <div className="empty">Loading…</div> : revs.length === 0 ? <div className="empty">No edits yet.</div> : (
          <Group>
            {revs.map((r) => (
              <Row
                key={r.id}
                title={r.title}
                meta={r.status === "done" ? `Done ${timeAgo(r.completedAt || r.createdAt)}` : dueLabel(r.dueAt)}
                trail={<span className={`pill ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>}
              />
            ))}
          </Group>
        )}
      </Section>

      {o?.nextPlan && (
        <Group><Row to="/plan" title="Need edits faster?" meta={`${o.nextPlan.name} turns them around in ${o.nextPlan.revisionTurnaround.toLowerCase()}`} /></Group>
      )}
    </Page>
  );
}
