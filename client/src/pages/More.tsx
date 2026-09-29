import { Link, useNavigate } from "react-router-dom";
import { post } from "../api";
import { useMe } from "../App";
import { Icon } from "../components/Icon";
import { PushBanner } from "../components/Layout";
import { useNotifications } from "../components/Notifications";

export default function More() {
  const { info, setMe } = useMe();
  const nav = useNavigate();
  const { toast } = useNotifications();
  const rows = [
    { to: "/plan", icon: "rocket", title: "Your plan & upgrades", sub: "See what's included and what's next" },
    { to: "/refer", icon: "gift", title: "Refer a business, get $100", sub: "Off your next month for every signup" },
    { to: "/help", icon: "sparkle", title: "Assistant", sub: "Edits, site checks, reach Cam & Trae" },
  ];
  return (
    <main className="main">
      <div style={{ padding: "10px 2px 0" }}>
        <h1>{info?.client?.businessName}</h1>
        <p className="muted small" style={{ marginTop: 4 }}>Signed in as {info?.user?.email}</p>
      </div>
      <div className="card">
        <div className="list">
          {rows.map((r) => (
            <Link key={r.to} to={r.to} className="item" style={{ alignItems: "center" }}>
              <div className="avatar" style={{ width: 40, height: 40 }}><Icon name={r.icon} size={18} /></div>
              <div className="grow"><div style={{ fontWeight: 600 }}>{r.title}</div><div className="small muted">{r.sub}</div></div>
              <Icon name="arrow" size={18} />
            </Link>
          ))}
        </div>
      </div>
      <PushBanner />
      <div className="card col">
        <h2>Alerts</h2>
        <p className="small muted">We buzz you for new leads, finished edits, replies from the team and your monthly report.</p>
        <button className="btn" onClick={async () => { await post("/push/test"); toast("🕷️ Buzz check", "This is what a new lead feels like.", "lead"); }}>
          <Icon name="bell" size={18} /> Test the buzz
        </button>
      </div>
      <div className="card col">
        <h2>Talk to a human</h2>
        <p className="small muted">Cam and Trae pick up until 7:30 PM Eastern.</p>
        <div className="btn-row">
          <a className="btn" href="mailto:hello@blackwidow.studio"><Icon name="mail" size={18} /> Email</a>
          <Link className="btn" to="/help"><Icon name="chat" size={18} /> Message</Link>
        </div>
      </div>
      <button className="btn ghost" onClick={async () => { await post("/auth/logout"); setMe(null); nav("/"); }}><Icon name="logout" size={18} /> Sign out</button>
    </main>
  );
}
