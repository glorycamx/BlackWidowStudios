import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, WebMark } from "./Icon";
import { BellButton } from "./Notifications";
import { RevealText } from "./Motion";
import { useMe } from "../App";

// Every page has one identity: the same icon, color and name everywhere it appears
export const PAGES = {
  home: { title: "Home", icon: "home", tone: "ink" },
  leads: { title: "Leads", icon: "leads", tone: "red" },
  lead: { title: "Lead", icon: "leads", tone: "red" },
  assistant: { title: "Assistant", icon: "sparkle", tone: "violet" },
  website: { title: "Website", icon: "globe", tone: "blue" },
  edits: { title: "Edits", icon: "edit", tone: "blue" },
  earn: { title: "Earn", icon: "gift", tone: "gold" },
  plan: { title: "Plan", icon: "rocket", tone: "green" },
  account: { title: "Account", icon: "users", tone: "ink" },
  inbox: { title: "Inbox", icon: "inbox", tone: "red" },
  clients: { title: "Clients", icon: "users", tone: "ink" },
  client: { title: "Client", icon: "users", tone: "ink" },
  newClient: { title: "New client", icon: "plus", tone: "green" },
} as const;
export type PageKey = keyof typeof PAGES;

export function PageBadge({ page, size = 44 }: { page: PageKey; size?: number }) {
  const p = PAGES[page];
  return (
    <span className={`page-badge tone-${p.tone}`} style={{ width: size, height: size }}>
      <Icon name={p.icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

interface PageProps {
  page: PageKey;
  // Big title under the bar; defaults to the page name
  heading?: string;
  // One line saying what this page is for
  blurb?: ReactNode;
  // Where the Back button goes. Omit on top-level tab pages.
  back?: { to: string; label: string };
  wide?: boolean;
  headerExtra?: ReactNode;
  mainStyle?: React.CSSProperties;
  children: ReactNode;
}

export function Page({ page, heading, blurb, back, wide, headerExtra, mainStyle, children }: PageProps) {
  const p = PAGES[page];
  return (
    <>
      <NavBar title={p.title} back={back} />
      <main className={`main ${wide ? "wide" : ""}`} style={mainStyle}>
        <header className="page-hero">
          <PageBadge page={page} />
          <div className="grow">
            <h1><RevealText text={heading || p.title} /></h1>
            {blurb && <p className="page-blurb">{blurb}</p>}
          </div>
        </header>
        {headerExtra}
        {children}
      </main>
    </>
  );
}

export function NavBar({ title, back }: { title: string; back?: { to: string; label: string } }) {
  const { me } = useMe();
  return (
    <header className="navbar">
      <div className="nav-left">
        {back ? (
          <Link to={back.to} className="back-btn" aria-label={`Back to ${back.label}`}>
            <Icon name="back" size={18} stroke={2.2} />
            <span>{back.label}</span>
          </Link>
        ) : (
          <span className="nav-logo" aria-hidden="true"><WebMark size={22} /></span>
        )}
      </div>
      <div className="nav-title">{title}</div>
      <div className="nav-right">
        <BellButton />
        <Link to={me?.role === "team" ? "/team/account" : "/more"} className="avatar-btn" aria-label="Account">{(me?.name || "?")[0]}</Link>
      </div>
    </header>
  );
}

// A labeled block. `action` is a real button shown on the right of the label.
export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// Grouped card that holds rows
export function Group({ children }: { children: ReactNode }) {
  return <div className="group">{children}</div>;
}

interface RowProps {
  title: ReactNode;
  meta?: ReactNode;
  lead?: ReactNode;
  trail?: ReactNode;
  to?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

// One row in a group. Rows that go somewhere show a chevron; plain rows don't.
export function Row({ title, meta, lead, trail, to, href, onClick, external }: RowProps) {
  const body = (
    <>
      {lead}
      <div className="grow">
        <div className="row-title">{title}</div>
        {meta && <div className="row-meta">{meta}</div>}
      </div>
      {trail}
      {(to || href || onClick) && <span className="chev"><Icon name="chevron" size={16} stroke={2.2} /></span>}
    </>
  );
  if (to) return <Link to={to} className="grow-row tappable">{body}</Link>;
  if (href) return <a href={href} className="grow-row tappable" target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{body}</a>;
  if (onClick) return <button type="button" onClick={onClick} className="grow-row tappable">{body}</button>;
  return <div className="grow-row">{body}</div>;
}
