import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { get, post } from "../api";
import { buzz } from "../buzz";
import type { Notification } from "../types";
import { Icon } from "./Icon";
import { timeAgo } from "../util";
import { celebrate } from "../motion";

interface Ctx {
  unread: number;
  items: Notification[];
  open: () => void;
  refresh: () => void;
  toast: (title: string, body?: string, kind?: string) => void;
  kinds: Set<string>;
  markSeen: (kinds: string[]) => void;
}
const NotificationsCtx = createContext<Ctx>(null!);
export const useNotifications = () => useContext(NotificationsCtx);

interface Toast { id: number; title: string; body?: string; kind: string; url?: string }

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastId = useRef<number | null>(null);
  const nav = useNavigate();

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random();
    setToasts((ts) => [{ ...t, id }, ...ts].slice(0, 3));
    buzz(t.kind);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await get<{ notifications: Notification[]; unread: number }>("/notifications");
      setUnread(data.unread);
      setItems(data.notifications);
      const newest = data.notifications[0]?.id ?? 0;
      if (lastId.current !== null && newest > lastId.current) {
        // Pop, buzz and chime for everything that arrived since the last poll
        data.notifications
          .filter((n) => n.id > lastId.current!)
          .reverse()
          .forEach((n) => {
            pushToast({ title: n.title, body: n.body, kind: n.kind, url: n.url });
            // Money moments get confetti
            if (/earned|card complete|credit applied|won a job|site is live/i.test(n.title)) celebrate();
          });
      }
      lastId.current = newest;
    } catch {}
  }, [pushToast]);

  // Failed requests get a visible message instead of a silent stall (at most one every few seconds)
  useEffect(() => {
    let last = 0;
    const onErr = (e: Event) => {
      if (Date.now() - last < 5000) return;
      last = Date.now();
      const id = Math.random();
      setToasts((ts) => [{ id, title: "Couldn't finish that", body: (e as CustomEvent).detail, kind: "error" }, ...ts].slice(0, 3));
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 6000);
    };
    window.addEventListener("bw:api-error", onErr);
    return () => window.removeEventListener("bw:api-error", onErr);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 8000);
    const onVis = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [refresh]);

  const openDrawer = () => {
    setDrawer(true);
    if (unread) post("/notifications/read-all").then(() => setUnread(0));
  };

  const go = (url?: string) => {
    setDrawer(false);
    if (url) nav(url);
  };

  // A tab's dot clears once that tab has been opened, even before the bell is opened
  const [seen, setSeen] = useState<Record<string, number>>({});
  const markSeen = useCallback((ks: string[]) => {
    setSeen((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const k of ks) {
        const top = Math.max(0, ...items.filter((n) => n.kind === k).map((n) => n.id));
        if ((next[k] || 0) < top) { next[k] = top; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [items]);
  const kinds = new Set(items.filter((n) => !n.read && n.id > (seen[n.kind] || 0)).map((n) => n.kind));

  return (
    <NotificationsCtx.Provider value={{ unread, items, open: openDrawer, refresh, toast: (title, body, kind = "default") => pushToast({ title, body, kind }), kinds, markSeen }}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast" onClick={() => { setToasts((ts) => ts.filter((x) => x.id !== t.id)); go(t.url); }}>
            <div className="grow">
              <div className="t-title">{t.title}</div>
              {t.body && <div className="t-body">{t.body}</div>}
            </div>
          </div>
        ))}
      </div>
      {drawer && (
        <>
          <div className="drawer-bg" onClick={() => setDrawer(false)} />
          <aside className="drawer" role="dialog" aria-label="Notifications">
            <div className="drawer-head">
              <h1 className="grow" style={{ fontSize: 24 }}>Notifications</h1>
              <button className="icon-btn" onClick={() => setDrawer(false)} aria-label="Close"><Icon name="close" /></button>
            </div>
            <div className="drawer-body">
              {items.length === 0 && <div className="empty">Nothing yet.</div>}
              {items.map((n) => (
                <button key={n.id} className={`notif ${n.read ? "" : "unread"}`} onClick={() => go(n.url)}>
                  <div className="grow">
                    <div className="n-title">{n.title}</div>
                    <div className="small muted">{n.body}</div>
                    <div className="tiny muted" style={{ marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </>
      )}
    </NotificationsCtx.Provider>
  );
}

export function BellButton() {
  const { unread, open } = useNotifications();
  return (
    <button className={`icon-btn ${unread ? "buzzing" : ""}`} key={unread} onClick={open} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
      <Icon name="bell" size={22} />
      {unread > 0 && <span className="badge pulse">{unread > 9 ? "9+" : unread}</span>}
    </button>
  );
}
