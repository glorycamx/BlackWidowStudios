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
    { to: "/plan", title: "Plan & upgrades" },
    { to: "/revisions", title: "Edits" },
    { to: "/refer", title: "Earn" },
    { to: "/help", title: "Assistant" },
  ];
  return (
    <main className="main">
      <div className="page-head">
        <h1>{info?.client?.businessName}</h1>
        <p className="muted small">{info?.user?.email}</p>
      </div>
      <div className="list">
        {rows.map((r) => (
          <Link key={r.to} to={r.to} className="item"><span className="grow">{r.title}</span><Icon name="arrow" size={16} /></Link>
        ))}
        <button className="item" style={{ background: "none", border: 0, borderTop: "1px solid var(--line)", width: "100%", textAlign: "left" }} onClick={async () => { await post("/push/test"); toast("Buzz check", "This is what a new lead feels like.", "lead"); }}>
          <span className="grow">Test notifications</span><Icon name="bell" size={16} />
        </button>
        <a className="item" href="mailto:hello@blackwidow.studio"><span className="grow">Email Cam & Trae</span><span className="meta">until 7:30 PM</span></a>
      </div>
      <PushBanner />
      <button className="btn ghost" style={{ alignSelf: "flex-start", paddingLeft: 0, color: "var(--muted)" }} onClick={async () => { await post("/auth/logout"); setMe(null); nav("/"); }}>Sign out</button>
    </main>
  );
}
