import { RevealText } from "../components/Motion";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { WebMark } from "../components/Icon";

interface Info { business: string; owner: string; offer: string }

// Public page someone lands on from a client's share link. No login.
export default function PublicReferral() {
  const { code = "" } = useParams();
  const [info, setInfo] = useState<Info | null>(null);
  const [missing, setMissing] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [v, setV] = useState({ name: "", business: "", phone: "", email: "", note: "", _gotcha: "" });

  useEffect(() => {
    api<Info>("GET", `/public/ref/${encodeURIComponent(code)}`).then(setInfo).catch(() => setMissing(true));
  }, [code]);

  const f = (k: keyof typeof v) => ({ id: `ref-${k}`, value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value }) });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      await api("POST", `/public/ref/${encodeURIComponent(code)}`, v);
      setDone(true);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const amount = info?.offer.match(/\$\d[\d,]*/)?.[0];

  return (
    <div className="landing">
      <div className="row" style={{ gap: 10 }}>
        <WebMark size={26} />
        <div className="brand">Black Widow Studios</div>
      </div>
      {missing ? (
        <div><h1>This link isn't active</h1><p className="muted small" style={{ marginTop: 8 }}>Ask whoever sent it for a new one, or email hello@blackwidow.studio.</p></div>
      ) : !info ? (
        <div className="empty">Loading…</div>
      ) : done ? (
        <div className="col" style={{ gap: 10 }}>
          <h1>You're in.</h1>
          <p className="muted">Cam will reach out shortly to hear about your business. We pick up until 7:30 PM Eastern. Your {amount || "discount"} is locked in.</p>
        </div>
      ) : (
        <>
          <div className="date-line">{info.owner} from {info.business} sent you</div>
          <h1><RevealText text="Get a website that" /> <span className="accent"><RevealText text="actually gets you calls." /></span></h1>
          <div className="offer">
            <span className="amt">{amount || "Offer"}</span>
            <span className="small muted">off your website build, because {info.owner} sent you</span>
          </div>
          <ul className="checks">
            <li>We build your new site first. You see it before you pay a dime.</li>
            <li>Local, from Londonderry, NH. Leads go straight to your phone.</li>
          </ul>
          <form className="form" onSubmit={submit}>
            <label htmlFor="ref-name">Your name<input {...f("name")} required minLength={2} autoComplete="name" /></label>
            <label htmlFor="ref-business">Business name<input {...f("business")} autoComplete="organization" /></label>
            <div className="grid2">
              <label htmlFor="ref-phone">Phone<input {...f("phone")} type="tel" autoComplete="tel" /></label>
              <label htmlFor="ref-email">Email<input {...f("email")} type="email" autoComplete="email" /></label>
            </div>
            <label htmlFor="ref-note">What do you do? (optional)<textarea {...f("note")} placeholder="e.g. Landscaping in Salem NH, no website yet" style={{ minHeight: 70 }} /></label>
            <input {...f("_gotcha")} tabIndex={-1} autoComplete="off" style={{ display: "none" }} aria-hidden="true" />
            {err && <div className="err">{err}</div>}
            <button className="btn primary block" disabled={busy}>{busy ? "Sending…" : "Get my free demo site"}</button>
            <p className="tiny muted">Cam or Trae will reach out. No spam.</p>
          </form>
        </>
      )}
    </div>
  );
}
