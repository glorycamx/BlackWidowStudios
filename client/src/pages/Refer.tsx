import { useEffect, useState } from "react";
import { get, post } from "../api";
import type { Referral } from "../types";
import { Icon } from "../components/Icon";
import { useNotifications } from "../components/Notifications";
import { timeAgo } from "../util";

const STATUS: Record<string, [string, string]> = { new: ["Sent", ""], contacted: ["Talking", "amber"], signed: ["Signed · $100 off", "green"], lost: ["Not now", ""] };

export default function Refer() {
  const [refs, setRefs] = useState<Referral[]>([]);
  const [credit, setCredit] = useState(100);
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const { toast } = useNotifications();
  const load = () => get<{ referrals: Referral[]; credit: number }>("/client/referrals").then((r) => { setRefs(r.referrals); setCredit(r.credit); });
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await post("/client/referrals", { name, business: business || null, phone: phone || null });
    setName(""); setBusiness(""); setPhone("");
    toast("Referral sent 🤝", `Cam will reach out. You get $${credit} off when they sign.`, "referral");
    load();
  };

  const earned = refs.filter((r) => r.status === "signed").length * credit;

  return (
    <main className="main">
      <div className="upsell">
        <div className="eyebrow">Referral program</div>
        <h3 style={{ fontSize: 26 }}>Give a great website.<br />Get ${credit} off.</h3>
        <p className="small">For every business owner you send us who signs up, we take ${credit} off your next month. No limit.</p>
        {earned > 0 && <div className="pill" style={{ marginTop: 12, background: "#fff", color: "#9a0e18", border: 0 }}>You've earned ${earned} 🎉</div>}
      </div>

      <form className="card form" onSubmit={submit}>
        <h2>Who should we talk to?</h2>
        <label>Their name<input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} placeholder="Rick" /></label>
        <label>Business<input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Rick's Landscaping" /></label>
        <label>Phone<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="603-555-0100" /></label>
        <button className="btn primary"><Icon name="send" size={18} /> Send to Cam</button>
      </form>

      {refs.length > 0 && (
        <div className="card">
          <div className="card-head"><h2>Your referrals</h2></div>
          <div className="list">
            {refs.map((r) => (
              <div key={r.id} className="item" style={{ alignItems: "center" }}>
                <div className="grow"><div style={{ fontWeight: 600 }}>{r.name}</div><div className="small muted">{r.business || r.phone} · {timeAgo(r.createdAt)}</div></div>
                <span className={`pill ${STATUS[r.status]?.[1]}`}>{STATUS[r.status]?.[0]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
