import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { get, post } from "../api";
import type { Overview, WebsiteStats } from "../types";
import { Icon } from "../components/Icon";
import { Upsell } from "../components/Upsell";
import { Sparkline, dailyCounts } from "../components/Sparkline";
import { useNotifications } from "../components/Notifications";
import { downscale, photoSrc } from "../photos";
import { timeAgo } from "../util";

const QUICK = [
  { icon: "calendar", label: "Update hours", q: "Please update our business hours to: " },
  { icon: "bolt", label: "Add a special", q: "Add a special to the site: " },
  { icon: "plus", label: "Add a service", q: "Add a new service to the site: " },
  { icon: "star", label: "Change prices", q: "Please update these prices on the site: " },
  { icon: "text", label: "Change wording", q: "Change this wording on the site: " },
  { icon: "pulse", label: "Something's broken", q: "Something on my site isn't working: " },
];

export default function Website() {
  const [w, setW] = useState<WebsiteStats | null>(null);
  const [o, setO] = useState<Overview | null>(null);
  const [checking, setChecking] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { toast } = useNotifications();

  const load = () => get<WebsiteStats>("/client/website").then(setW);
  useEffect(() => {
    load();
    get<Overview>("/client/overview").then(setO);
  }, []);
  if (!w) return <main className="main"><div className="empty">Loading…</div></main>;

  const host = w.siteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const maxPage = Math.max(1, ...w.traffic.topPages.map((p) => p.views));

  const checkNow = async () => {
    setChecking(true);
    const r = await post<{ ok: boolean; detail: string }>("/client/site-check");
    setChecking(false);
    toast(r.ok ? "Your site is up ✅" : "Site issue found", r.detail, r.ok ? "revision_done" : "escalation");
  };

  const upload = async () => {
    setUploading(true);
    try {
      const photos = await Promise.all(files.map(async (f) => ({ dataUrl: await downscale(f) })));
      await post("/client/photos", { photos, note: note || null });
      toast("Photos sent 📸", `We'll add ${photos.length > 1 ? "them" : "it"} to your site and buzz you when it's live.`, "revision_update");
      setFiles([]); setNote("");
      load();
    } catch (e: any) {
      toast("Upload didn't go through", e.message, "escalation");
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="main">
      <div style={{ padding: "10px 2px 0" }}>
        <div className="date-line">Your website</div>
        <h1 style={{ marginTop: 6 }}>{host ? <>{host.split(".")[0]}<span className="accent">.{host.split(".").slice(1).join(".") || "com"}</span></> : "Your new site"}</h1>
      </div>

      <div className="card col" style={{ gap: 12 }}>
        <div className="row">
          <span className={`pill ${w.status === "live" ? (w.health.up === false ? "red" : "green") : "amber"}`}>
            {w.status !== "live" ? (w.status === "phase1" ? "Phase 1 review" : "Being built") : w.health.up === false ? "Down, team alerted" : "Live"}
          </span>
          <span className="spacer" />
          {w.siteUrl && <a className="btn sm" href={/^https?:/.test(w.siteUrl) ? w.siteUrl : `https://${w.siteUrl}`} target="_blank" rel="noreferrer"><Icon name="globe" size={16} /> Visit</a>}
          <button className="btn sm" onClick={checkNow} disabled={checking || !w.siteUrl}><Icon name="pulse" size={16} /> {checking ? "Checking…" : "Check"}</button>
        </div>
        <div className="health">
          <div><b>{w.health.uptime != null ? `${w.health.uptime}%` : "—"}</b><span>Uptime · 30d</span></div>
          <div><b>{w.health.responseMs != null ? `${(w.health.responseMs / 1000).toFixed(1)}s` : "—"}</b><span>Load time</span></div>
          <div><b>{w.health.https ? "🔒 On" : "—"}</b><span>Secure (HTTPS)</span></div>
        </div>
        <p className="tiny muted">We check your site every 15 minutes{w.health.checkedAt ? `, last ${timeAgo(w.health.checkedAt)}` : ""}. If it goes down, Cam and Trae get buzzed right away.</p>
      </div>

      <div className="grid2" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div className="stat"><span className="label">Visitors</span><span className="num">{w.traffic.views}</span></div>
        <div className="stat"><span className="label">Calls tapped</span><span className="num">{w.traffic.calls}</span></div>
        <div className="stat"><span className="label">Forms sent</span><span className="num">{w.traffic.forms}</span></div>
      </div>

      {w.tracking ? (
        <div className="card">
          <div className="card-head"><h2>Visitors · last 30 days</h2></div>
          <Sparkline values={dailyCounts(w.traffic.dailyViews, 30)} height={56} />
          {w.traffic.topPages.length > 0 && (
            <div className="col" style={{ marginTop: 14, gap: 10 }}>
              <div className="meta">Most visited pages</div>
              {w.traffic.topPages.map((p) => (
                <div key={p.path}>
                  <div className="row small"><span className="grow ellipsis">{p.path === "/" ? "Home" : p.path}</span><b>{p.views}</b></div>
                  <div className="hbar"><i style={{ width: `${(p.views / maxPage) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="banner">
          <span style={{ fontSize: 22 }}>📊</span>
          <div className="grow small"><b>Visitor stats aren't on yet.</b> <span className="muted">We add a tiny tracker to your site so you can see visits and calls here.</span></div>
          <button className="btn sm" onClick={() => nav(`/help?q=${encodeURIComponent("Can you turn on visitor tracking for my site?")}`)}>Turn on</button>
        </div>
      )}

      <div className="col" style={{ gap: 10 }}>
        <h2 style={{ padding: "0 2px" }}>Quick changes</h2>
        <div className="tiles">
          {QUICK.map((q) => (
            <button key={q.label} className="tile" onClick={() => nav(`/help?q=${encodeURIComponent(q.q)}`)}>
              <span className="ti"><Icon name={q.icon} size={17} /></span>
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card col" style={{ gap: 12 }}>
        <div className="card-head" style={{ marginBottom: 0 }}>
          <h2><span className="ic">📸</span> Send job photos</h2>
        </div>
        <p className="small muted">Fresh photos of your work make your site sell. Snap them, send them, and we'll put them in the right spots.</p>
        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 10))} />
        {files.length === 0 ? (
          <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="plus" size={18} /> Choose photos</button>
        ) : (
          <div className="col">
            <div className="thumbs">{files.map((f) => <img key={f.name + f.size} src={URL.createObjectURL(f)} alt="" />)}</div>
            <input placeholder="Where should they go? (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="btn-row">
              <button className="btn primary grow" onClick={upload} disabled={uploading}>{uploading ? "Sending…" : `Send ${files.length} photo${files.length > 1 ? "s" : ""}`}</button>
              <button className="btn ghost" onClick={() => setFiles([])}>Clear</button>
            </div>
          </div>
        )}
        {w.photos.length > 0 && (
          <>
            <div className="meta">Sent recently</div>
            <div className="thumbs">{w.photos.slice(0, 8).map((p) => <img key={p.id} src={photoSrc(p)} alt={p.note || "Job photo"} loading="lazy" />)}</div>
          </>
        )}
      </div>

      <Link to="/revisions" className="card row">
        <span className="ic" style={{ width: 36, height: 36, borderRadius: 10, display: "grid", placeItems: "center", background: "var(--surface-2)" }}><Icon name="edit" size={18} /></span>
        <div className="grow">
          <div style={{ fontWeight: 600 }}>Edits{o?.openRevisions.length ? ` · ${o.openRevisions.length} in progress` : ""}</div>
          <div className="small muted">{o ? `${o.plan.revisionTurnaround} turnaround on ${o.plan.name}` : "Track every change"}</div>
        </div>
        <Icon name="arrow" size={18} />
      </Link>

      {o && o.plan.tier < 4 && (
        <Upsell
          item="seo"
          eyebrow={w.traffic.views ? `${w.traffic.views} visitors this month` : "Get found in more towns"}
          title="Show up first in every town you serve."
          body="Town pages, keyword research and monthly rank reports. More visitors, more calls, same phone."
          cta="Grow my traffic"
          note="Interested in SEO / town pages (from Website screen)"
        />
      )}
    </main>
  );
}
