import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { BellButton, useNotifications } from "./Notifications";
import { Icon, WebMark } from "./Icon";
import { DEMO, post } from "../api";
import { demoSwitch } from "../demo";
import { useMe } from "../App";
import { pushState, enablePush, type PushState } from "../buzz";

function DemoBar() {
  const { me } = useMe();
  if (!DEMO) return null;
  const other = me?.role === "team" ? "client" : "team";
  return (
    <div className="demo-bar">
      Sample data · {me?.role === "team" ? "team view" : "client view"}
      <button onClick={() => { demoSwitch(other); location.hash = other === "team" ? "#/team" : "#/"; location.reload(); }}>
        Switch to {other}
      </button>
    </div>
  );
}

export function PushBanner() {
  const [state, setState] = useState<PushState | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => { pushState().then(setState); }, []);
  if (!state || state === "on" || state === "unsupported") return null;
  const text =
    state === "ios-install" ? "Add to Home Screen (Share → Add to Home Screen) to get lead alerts."
    : state === "denied" ? "Notifications are blocked. Turn them on in your phone's settings."
    : err || "Get a buzz the second a lead comes in.";
  return (
    <div className="banner">
      <Icon name="bell" size={18} />
      <div className="grow small">{text}</div>
      {state === "off" && <button className="btn sm primary" onClick={() => enablePush().then(setState).catch((e) => setErr(e.message))}>Turn on</button>}
    </div>
  );
}

export function ClientLayout() {
  const { kinds } = useNotifications();
  const { me } = useMe();
  const tabs = [
    { to: "/", label: "Home", icon: "home", dot: kinds.has("offer") || kinds.has("site_live") },
    { to: "/leads", label: "Leads", icon: "leads", dot: kinds.has("lead") },
    { to: "/help", label: "Assistant", icon: "sparkle", dot: kinds.has("team_reply") },
    { to: "/website", label: "Website", icon: "globe", dot: kinds.has("revision_done") || kinds.has("revision_update") },
    { to: "/refer", label: "Earn", icon: "gift", dot: kinds.has("referral") },
  ];
  return (
    <div className="app">
      <DemoBar />
      <header className="topbar">
        <div className="brand"><WebMark size={22} /> Black Widow</div>
        <div className="spacer" />
        <BellButton />
        <NavLink to="/more" className="avatar-btn" aria-label="Account">{(me?.name || "?")[0]}</NavLink>
      </header>
      <Outlet />
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === "/"} className={({ isActive }) => (isActive ? "active" : "")}>
            <Icon name={t.icon} size={20} />
            {t.label}
            {t.dot && <span className="dot" />}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function TeamLayout() {
  const { setMe } = useMe();
  const nav = useNavigate();
  const { kinds } = useNotifications();
  return (
    <div className="app">
      <DemoBar />
      <header className="topbar">
        <div className="brand"><WebMark size={22} /> Black Widow <span className="muted" style={{ letterSpacing: 0, textTransform: "none", fontWeight: 400 }}>Team</span></div>
        <div className="spacer" />
        <BellButton />
        <button className="icon-btn" aria-label="Sign out" onClick={async () => { await post("/auth/logout"); setMe(null); nav("/"); }}><Icon name="logout" /></button>
      </header>
      <Outlet />
      <nav className="tabbar">
        <NavLink to="/team" end className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon name="inbox" size={21} /> Inbox
          {(kinds.has("escalation") || kinds.has("upgrade_request")) && <span className="dot" />}
        </NavLink>
        <NavLink to="/team/clients" className={({ isActive }) => (isActive ? "active" : "")}><Icon name="users" size={21} /> Clients</NavLink>
        <NavLink to="/team/new" className={({ isActive }) => (isActive ? "active" : "")}><Icon name="plus" size={21} /> New client</NavLink>
      </nav>
    </div>
  );
}
