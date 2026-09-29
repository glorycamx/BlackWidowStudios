import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import type { ReferralSummary, Referral } from "../types";
import { Icon } from "../components/Icon";
import { useNotifications } from "../components/Notifications";
import { useMe } from "../App";
import { timeAgo } from "../util";

export function shareMessage(r: ReferralSummary, business?: string) {
  return `Hey! Black Widow Studios built our website${business ? ` for ${business}` : ""} and it's been great for getting calls. They build yours first so you see it before you pay a dime. Use my link and you get ${r.program.friendOffer}: ${r.link}`;
}

export function EarningsTicket({ r, mini }: { r: ReferralSummary; mini?: boolean }) {
  return (
    <div className={`ticket ${mini ? "mini" : ""}`}>
      <div className="ticket-main">
        <span className="eyebrow">Referral earnings</span>
        <span className="big">${r.stats.earned.toLocaleString()}</span>
        <span className="sub">
          {r.stats.earned === 0
            ? `Your first signup is worth $${r.program.perSignup}.`
            : r.stats.pending
              ? `$${r.stats.pending} coming off your next bill`
              : "All applied to your bill. Keep it going!"}
        </span>
        {!mini && (
          <div className="chips-row">
            <span className="tchip">${r.program.perSignup} per signup</span>
            <span className="tchip">+${r.program.cardBonus} per full card</span>
            {r.stats.inPlay > 0 && <span className="tchip">{r.stats.inPlay} in play · up to ${r.stats.potential}</span>}
          </div>
        )}
      </div>
      <div className="ticket-stub">
        <span className="count">{r.stats.signedCount}</span>
        <span className="lbl">signed</span>
        {!mini && <span className="no">No. {r.code}</span>}
      </div>
    </div>
  );
}

export function PunchCard({ r }: { r: ReferralSummary }) {
  const slots = r.program.cardSlots;
  const onCard = r.stats.signedCount % slots;
  const fullCards = Math.floor(r.stats.signedCount / slots);
  const left = slots - onCard;
  return (
    <div className="card col" style={{ gap: 14 }}>
      <div className="card-rule">
        <h2>Punch card{fullCards > 0 ? ` #${fullCards + 1}` : ""}</h2>
        <span className="pill gold">{fullCards > 0 ? `${fullCards} full card${fullCards > 1 ? "s" : ""} 🏆` : `Fill it: +$${r.program.cardBonus}`}</span>
      </div>
      <div className="punch">
        {Array.from({ length: slots }, (_, i) => {
          const punched = i < onCard;
          const bonus = i === slots - 1;
          return (
            <div key={i} className={`hole ${punched ? "punched" : ""} ${bonus ? "bonus" : ""}`} style={{ animationDelay: `${i * 90}ms` }}>
              {punched ? "🕷️" : bonus ? <>+${r.program.perSignup + r.program.cardBonus}</> : <>${r.program.perSignup}</>}
            </div>
          );
        })}
      </div>
      <p className="small muted">
        {left === slots
          ? `Every business you send that signs punches a hole. Fill all ${slots} and the last one's worth $${r.program.perSignup + r.program.cardBonus}.`
          : `${left} more signup${left > 1 ? "s" : ""} to fill this card and grab the $${r.program.cardBonus} bonus.`}
      </p>
    </div>
  );
}

const STEPS: { key: string; label: string }[] = [
  { key: "new", label: "Sent" },
  { key: "contacted", label: "Talking" },
  { key: "signed", label: "Signed" },
  { key: "applied", label: "Paid you" },
];

function stage(r: Referral) {
  if (r.creditStatus === "applied") return 3;
  if (r.status === "signed") return 2;
  if (r.status === "contacted") return 1;
  return 0;
}

export default function Refer() {
  const { info } = useMe();
  const [r, setR] = useState<ReferralSummary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const { toast, items } = useNotifications();
  const load = () => get<ReferralSummary>("/client/referrals").then(setR);
  useEffect(() => { load(); }, [items[0]?.id]);
  if (!r) return <main className="main"><div className="empty">Loading…</div></main>;

  const biz = info?.client?.businessName?.replace(/\s*\(.*?\)\s*/g, " ").trim();
  const msg = shareMessage(r, biz);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(r.link);
      toast("Link copied 📋", "Paste it anywhere: texts, Facebook, your email signature.", "offer");
    } catch {
      toast("Copy didn't work", "Press and hold the link to copy it.", "offer");
    }
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: "Black Widow Studios", text: msg, url: r.link }); } catch {}
    } else copy();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await post("/client/referrals", { name, business: business || null, phone: phone || null });
    setName(""); setBusiness(""); setPhone(""); setShowForm(false);
    toast("Referral sent 🤝", `Cam will reach out. You earn $${r.program.perSignup} when they sign.`, "referral");
    load();
  };

  return (
    <main className="main">
      <div style={{ padding: "10px 2px 0" }}>
        <div className="date-line">Earn</div>
        <h1 style={{ marginTop: 6 }}>Send us a business. <span className="accent">Get paid</span> in free months.</h1>
      </div>

      <EarningsTicket r={r} />
      <PunchCard r={r} />

      <div className="card col" style={{ gap: 12 }}>
        <h2>Your link</h2>
        <div className="share-link">
          <code>{r.link.replace(/^https?:\/\//, "")}</code>
          <button className="btn sm" onClick={copy}>Copy</button>
        </div>
        <div className="share-btns">
          <button className="btn primary" onClick={share}><Icon name="send" size={18} /> Share</button>
          <a className="btn" href={`sms:?&body=${encodeURIComponent(msg)}`}><Icon name="text" size={18} /> Text a friend</a>
        </div>
        <Link to={`/r/${r.code}`} className="small accent" style={{ fontWeight: 600 }}>See the page your friends see →</Link>
        <p className="tiny muted">They get {r.program.friendOffer}. You get ${r.program.perSignup} off your bill when they sign, and we buzz you the second they use your link.</p>
      </div>

      <div className="card howto">
        <h2>How it works</h2>
        <div className="step"><span className="n">1</span><div><b>Share your link</b><div className="small muted">Text it to the plumber, the landscaper, your cousin with the food truck.</div></div></div>
        <div className="step"><span className="n">2</span><div><b>We build their site first</b><div className="small muted">They see it before paying a dime, plus {r.program.friendOffer}.</div></div></div>
        <div className="step"><span className="n">3</span><div><b>You earn ${r.program.perSignup} per signup</b><div className="small muted">Off your monthly. Fill a {r.program.cardSlots}-punch card for a ${r.program.cardBonus} bonus. No limit.</div></div></div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Your referrals</h2>
          <button className="btn sm" onClick={() => setShowForm((v) => !v)}><Icon name="plus" size={16} /> Add one</button>
        </div>
        {showForm && (
          <form className="form" onSubmit={submit} style={{ marginBottom: 14 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Their name" />
            <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business (optional)" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
            <button className="btn primary">Send to Cam</button>
          </form>
        )}
        {r.referrals.length === 0 ? (
          <div className="empty">No referrals yet. Your first one's worth ${r.program.perSignup}.</div>
        ) : (
          <div className="list">
            {r.referrals.map((ref) => {
              const st = stage(ref);
              return (
                <div key={ref.id} className="item" style={{ display: "block" }}>
                  <div className="row">
                    <div className="grow">
                      <div style={{ fontWeight: 600 }}>{ref.name}{ref.business ? <span className="muted" style={{ fontWeight: 500 }}> · {ref.business}</span> : null}</div>
                      <div className="tiny muted">{ref.source === "link" ? "Used your link" : "You sent them"} · {timeAgo(ref.createdAt)}</div>
                    </div>
                    {ref.status === "signed" ? (
                      <span className="pill green">+${ref.creditAmount}</span>
                    ) : ref.status === "lost" ? (
                      <span className="pill">Not now</span>
                    ) : (
                      <span className="pill amber">${r.program.perSignup} if they sign</span>
                    )}
                  </div>
                  {ref.status !== "lost" && (
                    <div className="tracker">
                      {STEPS.map((s, i) => <span key={s.key} className={i <= st ? (i === 3 ? "paid" : "on") : ""}>{s.label}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
