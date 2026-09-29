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

interface Tab { to: string; label: string; icon: string; kinds: string[] }

// Floating tab bar with an indicator that springs to the active tab
function TabBar({ tabs }: { tabs: Tab[] }) {
  const { pathname } = useLocation();
  const { kinds, markSeen, items } = useNotifications();
  const isOn = (t: Tab) => (t.to === "/" || t.to === "/team" ? pathname === t.to : pathname.startsWith(t.to));
  const current = tabs.find(isOn);
  useEffect(() => { if (current) markSeen(current.kinds); }, [pathname, items[0]?.id]);
  const idx = Math.max(0, tabs.findIndex((t) => (t.to === "/" || t.to === "/team" ? pathname === t.to : pathname.startsWith(t.to))));
  const active = tabs.some((t) => (t.to === "/" || t.to === "/team" ? pathname === t.to : pathname.startsWith(t.to)));
  return (
    <nav className="tabbar">
      {active && <span className="tab-indicator" style={{ width: `calc((100% - 8px) / ${tabs.length})`, transform: `translateX(${idx * 100}%)` }} />}
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.to === "/" || t.to === "/team"} className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon name={t.icon} size={20} />
          {t.label}
          {t.kinds.some((k) => kinds.has(k)) && !isOn(t) && <span className="dot" />}
        </NavLink>
      ))}
    </nav>
  );
}

export function ClientLayout() {
  const { kinds } = useNotifications();
  const { me } = useMe();
  const tabs: Tab[] = [
    { to: "/", label: "Home", icon: "home", kinds: ["offer", "site_live", "report"] },
    { to: "/leads", label: "Leads", icon: "leads", kinds: ["lead"] },
    { to: "/help", label: "Assistant", icon: "sparkle", kinds: ["team_reply"] },
    { to: "/website", label: "Website", icon: "globe", kinds: ["revision_done", "revision_update"] },
    { to: "/refer", label: "Earn", icon: "gift", kinds: ["referral"] },
  ];
  return (
    <div className="app">
      <DemoBar />
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
      <PageTransition><Outlet /></PageTransition>
      <TabBar
        tabs={[
          { to: "/team", label: "Inbox", icon: "inbox", kinds: ["escalation", "upgrade_request", "revision_created", "referral", "lead"] },
          { to: "/team/clients", label: "Clients", icon: "users", kinds: [] },
          { to: "/team/new", label: "New client", icon: "plus", kinds: [] },
        ]}
      />
    </div>
  );
}
