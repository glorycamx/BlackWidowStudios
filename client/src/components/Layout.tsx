import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { PageTransition } from "./Motion";
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

interface Tab { to: string; label: string; icon: string; dot: boolean }

// Floating tab bar with an indicator that springs to the active tab
function TabBar({ tabs }: { tabs: Tab[] }) {
  const { pathname } = useLocation();
  const idx = Math.max(0, tabs.findIndex((t) => (t.to === "/" || t.to === "/team" ? pathname === t.to : pathname.startsWith(t.to))));
  const active = tabs.some((t) => (t.to === "/" || t.to === "/team" ? pathname === t.to : pathname.startsWith(t.to)));
  return (
    <nav className="tabbar">
      {active && <span className="tab-indicator" style={{ width: `calc((100% - 8px) / ${tabs.length})`, transform: `translateX(${idx * 100}%)` }} />}
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === "/" || t.to === "/team"} className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon name={t.icon} size={20} />
          {t.label}
          {t.dot && <span className="dot" />}
        </NavLink>
      ))}
    </nav>
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
      <PageTransition><Outlet /></PageTransition>
      <TabBar tabs={tabs} />
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
      <PageTransition><Outlet /></PageTransition>
      <TabBar
        tabs={[
          { to: "/team", label: "Inbox", icon: "inbox", dot: kinds.has("escalation") || kinds.has("upgrade_request") },
          { to: "/team/clients", label: "Clients", icon: "users", dot: false },
          { to: "/team/new", label: "New client", icon: "plus", dot: false },
        ]}
      />
    </div>
  );
}
