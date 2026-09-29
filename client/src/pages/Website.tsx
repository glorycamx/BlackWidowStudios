import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "../api";
import type { Overview, WebsiteStats } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { Sparkline, dailyCounts } from "../components/Sparkline";
import { useNotifications } from "../components/Notifications";
import { downscale, photoSrc } from "../photos";
import { CountUp } from "../components/Motion";
import { Group, Page, Row, Section } from "../components/Page";

const QUICK = [
  { label: "Update hours", q: "Please update our business hours to: " },
  { label: "Add a special", q: "Add a special to the site: " },
  { label: "Add a service", q: "Add a new service to the site: " },
  { label: "Change prices", q: "Please update these prices on the site: " },
  { label: "Something's broken", q: "Something on my site isn't working: " },
];

export default function Website() {
  const [w, setW] = useState<WebsiteStats | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [checking, setChecking] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { toast } = useNotifications();

  const load = () => get<WebsiteStats>("/client/website").then(setW);
  useEffect(() => { load(); get<Overview>("/client/overview").then(setO); }, []);
  if (!w) return <Page page="website"><div className="empty">Loading…</div></Page>;

  const host = w.siteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const statusText = w.status !== "live" ? (w.status === "phase1" ? "Ready for your review" : "Being built") : w.health.up === false ? "Down · team alerted" : "Live";

  const checkNow = async () => {
    setChecking(true);
    const r = await post<{ ok: boolean; detail: string }>("/client/site-check");
    setChecking(false);
    toast(r.ok ? "Your site is up" : "Site issue found", r.detail, r.ok ? "revision_done" : "escalation");
  };
  const upload = async () => {
    setUploading(true);
    try {
      const photos = await Promise.all(files.map(async (f) => ({ dataUrl: await downscale(f) })));
      await post("/client/photos", { photos, note: null });
      toast("Photos sent", "We'll add them and buzz you when they're live.", "revision_update");
      setFiles([]);
      load();
    } catch (e: any) {
      toast("Upload didn't go through", e.message, "escalation");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Page
      page="website"
      blurb={<span className="row" style={{ gap: 8, flexWrap: "wrap" }}><span className={`sdot ${w.health.up === false ? "red" : w.status === "live" ? "green" : "amber"}`} />{host || "Your site"} · {statusText}</span>}
    >
      <div className="btn-row">
        {w.siteUrl && <a className="btn grow" href={/^https?:/.test(w.siteUrl) ? w.siteUrl : `https://${w.siteUrl}`} target="_blank" rel="noreferrer"><Icon name="globe" size={16} /> Open my site</a>}
        {w.siteUrl && <button className="btn grow" onClick={checkNow} disabled={checking}><Icon name="pulse" size={16} /> {checking ? "Checking…" : "Check it's up"}</button>}
      </div>

      <Section title="Health">
        <div className="figures cards">
          <div className="figure"><span className="n">{w.health.uptime != null ? `${w.health.uptime}%` : "—"}</span><span className="l">Uptime</span></div>
          <div className="figure"><span className="n">{w.health.responseMs != null ? `${(w.health.responseMs / 1000).toFixed(1)}s` : "—"}</span><span className="l">Load time</span></div>
          <div className="figure"><span className="n">{w.health.https ? "On" : "—"}</span><span className="l">Secure</span></div>
        </div>
      </Section>

      <Section title="Visitors · last 30 days">
        {w.tracking ? (
          <>
            <div className="figures cards">
              <div className="figure"><span className="n"><CountUp value={w.traffic.views} ms={1200} /></span><span className="l">Visitors</span></div>
              <div className="figure"><span className="n"><CountUp value={w.traffic.calls} /></span><span className="l">Calls tapped</span></div>
              <div className="figure"><span className="n"><CountUp value={w.traffic.forms} /></span><span className="l">Forms sent</span></div>
            </div>
            <div className="group" style={{ padding: "14px 16px 10px" }}>
              <Sparkline values={dailyCounts(w.traffic.dailyViews, 30)} height={48} color="var(--blue)" />
              <div className="tiny muted" style={{ marginTop: 6 }}>Most visited: {w.traffic.topPages.slice(0, 3).map((p) => (p.path === "/" ? "Home" : p.path)).join(", ")}</div>
            </div>
          </>
        ) : (
          <div className="banner small">
            <span className="grow muted">Visitor stats turn on once we add the tracker to your site.</span>
            <button className="btn sm" onClick={() => nav(`/help?q=${encodeURIComponent("Can you turn on visitor tracking for my site?")}`)}>Turn on</button>
          </div>
        )}
      </Section>

      <Section title="Make a change" action={<Link to="/revisions" className="btn sm">All edits{o?.openRevisions.length ? ` (${o.openRevisions.length})` : ""}</Link>}>
        <Group>
          {QUICK.map((q) => <Row key={q.label} title={q.label} onClick={() => nav(`/help?q=${encodeURIComponent(q.q)}`)} />)}
        </Group>
      </Section>

      <Section title="Job photos" action={files.length === 0 ? <button className="btn sm" onClick={() => fileRef.current?.click()}><Icon name="plus" size={14} /> Add</button> : undefined}>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))} />
        {files.length > 0 ? (
          <>
            <div className="thumbs">{files.map((f) => <img key={f.name + f.size} src={URL.createObjectURL(f)} alt="" />)}</div>
            <div className="btn-row">
              <button className="btn primary grow" onClick={upload} disabled={uploading}>{uploading ? "Sending…" : `Send ${files.length} photo${files.length > 1 ? "s" : ""}`}</button>
              <button className="btn" onClick={() => setFiles([])}>Cancel</button>
            </div>
          </>
        ) : w.photos.length > 0 ? (
          <div className="thumbs">{w.photos.slice(0, 8).map((p) => <img key={p.id} src={photoSrc(p)} alt={p.note || "Job photo"} loading="lazy" />)}</div>
        ) : (
          <p className="small muted">Send photos of your work and we'll put them on your site.</p>
        )}
      </Section>

      {o && o.plan.tier < 4 && (
        <Upsell item="seo" title="Show up in more towns" body="Town pages, SEO and monthly rank reports." cta="Interested" note="Interested in SEO / town pages (from Website screen)" />
      )}
    </Page>
  );
}
