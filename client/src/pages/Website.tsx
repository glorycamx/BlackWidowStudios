import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "../api";
import type { Overview, WebsiteStats } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { Sparkline, dailyCounts } from "../components/Sparkline";
import { useNotifications } from "../components/Notifications";
import { downscale, photoSrc } from "../photos";

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
  if (!w) return <main className="main"><div className="empty">Loading…</div></main>;

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
    <main className="main">
      <div className="page-head">
        <h1>{host || "Your website"}</h1>
        <div className="row small muted" style={{ gap: 8, flexWrap: "wrap" }}>
          <span className={`sdot ${w.health.up === false ? "red" : w.status === "live" ? "green" : "amber"}`} />
          <span>{statusText}</span>
          {w.health.uptime != null && <span>· {w.health.uptime}% uptime</span>}
          {w.health.responseMs != null && <span>· {(w.health.responseMs / 1000).toFixed(1)}s load</span>}
        </div>
        <div className="btn-row" style={{ marginTop: 6 }}>
          {w.siteUrl && <a className="btn sm" href={/^https?:/.test(w.siteUrl) ? w.siteUrl : `https://${w.siteUrl}`} target="_blank" rel="noreferrer">Visit</a>}
          {w.siteUrl && <button className="btn sm" onClick={checkNow} disabled={checking}>{checking ? "Checking…" : "Check now"}</button>}
        </div>
      </div>

      {w.tracking ? (
        <div className="section">
          <div className="figures">
            <div className="figure"><span className="n">{w.traffic.views}</span><span className="l">visitors</span></div>
            <div className="figure"><span className="n">{w.traffic.calls}</span><span className="l">calls tapped</span></div>
            <div className="figure"><span className="n">{w.traffic.forms}</span><span className="l">forms sent</span></div>
          </div>
          <Sparkline values={dailyCounts(w.traffic.dailyViews, 30)} height={44} color="var(--text)" />
          <span className="tiny muted">Last 30 days · top page: {w.traffic.topPages[0]?.path === "/" ? "Home" : w.traffic.topPages[0]?.path}</span>
        </div>
      ) : (
        <div className="banner small">
          <span className="grow muted">Visitor stats turn on once we add the tracker to your site.</span>
          <button className="btn sm" onClick={() => nav(`/help?q=${encodeURIComponent("Can you turn on visitor tracking for my site?")}`)}>Turn on</button>
        </div>
      )}

      <div className="section">
        <span className="label">Quick changes</span>
        <div className="list">
          {QUICK.map((q) => (
            <button key={q.label} className="item" style={{ background: "none", border: 0, borderTop: "1px solid var(--line)", textAlign: "left", width: "100%" }} onClick={() => nav(`/help?q=${encodeURIComponent(q.q)}`)}>
              <span className="grow">{q.label}</span>
              <Icon name="arrow" size={16} />
            </button>
          ))}
          <Link to="/revisions" className="item">
            <span className="grow">All edits{o?.openRevisions.length ? <span className="muted"> · {o.openRevisions.length} in progress</span> : ""}</span>
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="label">Job photos</span>
          {files.length === 0 && <button className="link small" onClick={() => fileRef.current?.click()}>Add photos</button>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))} />
        {files.length > 0 ? (
          <>
            <div className="thumbs">{files.map((f) => <img key={f.name + f.size} src={URL.createObjectURL(f)} alt="" />)}</div>
            <div className="btn-row">
              <button className="btn primary grow" onClick={upload} disabled={uploading}>{uploading ? "Sending…" : `Send ${files.length} photo${files.length > 1 ? "s" : ""}`}</button>
              <button className="btn ghost" onClick={() => setFiles([])}>Cancel</button>
            </div>
          </>
        ) : w.photos.length > 0 ? (
          <div className="thumbs">{w.photos.slice(0, 8).map((p) => <img key={p.id} src={photoSrc(p)} alt={p.note || "Job photo"} loading="lazy" />)}</div>
        ) : (
          <p className="small muted">Send photos of your work and we'll put them on your site.</p>
        )}
      </div>

      {o && o.plan.tier < 4 && (
        <Upsell item="seo" title="Show up in more towns" body="Town pages, SEO and monthly rank reports." cta="Interested" note="Interested in SEO / town pages (from Website screen)" />
      )}
    </main>
  );
}
