import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get, post } from "../api";
import type { ReferralSummary, Referral } from "../types";
import { Icon } from "../components/Icon";
import { useNotifications } from "../components/Notifications";
import { useMe } from "../App";
import { timeAgo } from "../util";
import { CountUp, RevealText } from "../components/Motion";
import { celebrate, useTilt } from "../motion";

export function shareMessage(r: ReferralSummary, business?: string) {
  return `Hey! Black Widow Studios built our website${business ? ` for ${business}` : ""} and it's been great for getting calls. They build yours first so you see it before you pay a dime. Use my link and you get ${r.program.friendOffer}: ${r.link}`;
}

export function EarningsTicket({ r, mini }: { r: ReferralSummary; mini?: boolean }) {
  const tilt = useTilt<HTMLDivElement>(mini ? 5 : 10);
  return (
    <div className="ticket-wrap">
    <div ref={tilt} className={`ticket ${mini ? "mini" : ""}`}>
      <div className="ticket-shine" />
      <div className="ticket-main">
        <span className="label">Earned from referrals</span>
        <span className="big"><CountUp value={r.stats.earned} prefix="$" ms={1300} /></span>
        <span className="sub">
          {r.stats.earned === 0
            ? `Your first signup is worth $${r.program.perSignup}.`
            : r.stats.pending
              ? <><span className="accent">${r.stats.pending}</span> coming off your next bill</>
              : "All applied to your bill"}
        </span>
      </div>
      <div className="ticket-stub">
        <span className="count"><CountUp value={r.stats.signedCount} /></span>
        <span className="lbl">signed</span>
      </div>
    </div>
    </div>
  );
}

export function PunchCard({ r }: { r: ReferralSummary }) {
  const slots = r.program.cardSlots;
  const onCard = r.stats.signedCount % slots;
  const left = slots - onCard;
  return (
    <div className="section">
      <div className="section-head">
        <span className="label">Punch card</span>
        <span className="small muted">{left} to go · +${r.program.cardBonus} bonus</span>
      </div>
      <div className="punch">
        {Array.from({ length: slots }, (_, i) => {
          const punched = i < onCard;
          const bonus = i === slots - 1;
          return (
            <div key={i} className={`hole ${punched ? "punched" : ""} ${bonus ? "bonus" : ""}`} style={{ animationDelay: `${300 + i * 140}ms` }}>
              {punched ? <Icon name="check" size={16} stroke={2.4} /> : `$${bonus ? r.program.perSignup + r.program.cardBonus : r.program.perSignup}`}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function stage(ref: Referral, per: number): [string, string] {
  if (ref.creditStatus === "applied") return [`Paid you $${ref.creditAmount}`, "green"];
  if (ref.status === "signed") return [`Signed · $${ref.creditAmount} on your next bill`, "green"];
  if (ref.status === "contacted") return [`Talking · $${per} if they sign`, "amber"];
  if (ref.status === "lost") return ["Not now", ""];
  return [`Sent · $${per} if they sign`, ""];
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
      celebrate();
      toast("Link copied", "Paste it in a text, Facebook, anywhere.", "offer");
    } catch {
      toast("Couldn't copy", "Press and hold the link to copy it.", "offer");
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
    celebrate();
    toast("Referral sent", `Cam will reach out. You earn $${r.program.perSignup} when they sign.`, "referral");
    load();
  };

  return (
    <main className="main">
      <div className="page-head">
        <h1><RevealText text="Earn" /></h1>
        <p className="muted small">${r.program.perSignup} off your bill for every business you send us that signs. They get {r.program.friendOffer}.</p>
      </div>

      <EarningsTicket r={r} />
      <PunchCard r={r} />

      <div className="section">
        <span className="label">Your link</span>
        <div className="share-link">
          <code>{r.link.replace(/^https?:\/\//, "")}</code>
          <button className="btn sm" onClick={copy}>Copy</button>
        </div>
        <div className="share-btns">
          <button className="btn primary" onClick={share}>Share</button>
          <a className="btn" href={`sms:?&body=${encodeURIComponent(msg)}`}>Text a friend</a>
        </div>
        <Link to={`/r/${r.code}`} className="small muted">Preview what they see →</Link>
      </div>

      <div className="section">
        <div className="section-head">
          <span className="label">Referrals</span>
          <button className="link small" onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "Add one"}</button>
        </div>
        {showForm && (
          <form className="form" onSubmit={submit}>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Their name" />
            <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business (optional)" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
            <button className="btn primary">Send to Cam</button>
          </form>
        )}
        {r.referrals.length === 0 ? (
          <div className="empty">No referrals yet.</div>
        ) : (
          <div className="list">
            {r.referrals.map((ref) => {
              const [text, tone] = stage(ref, r.program.perSignup);
              return (
                <div key={ref.id} className="item">
                  <span className={`sdot ${tone}`} />
                  <div className="grow">
                    <div className="title">{ref.name}{ref.business ? <span className="muted"> · {ref.business}</span> : null}</div>
                    <div className="meta">{text} · {timeAgo(ref.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
