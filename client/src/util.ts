export function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dueLabel(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "overdue";
  const h = ms / 3600_000;
  if (h < 1) return `due in ${Math.max(1, Math.round(ms / 60000))}m`;
  if (h < 24) return `due in ${Math.round(h)}h`;
  return `due ${new Date(iso).toLocaleDateString("en-US", { weekday: "short" })} ${new Date(iso).toLocaleTimeString("en-US", { hour: "numeric" })}`;
}

export function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d.length === 10 ? `${d}T12:00:00` : d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function initials(name: string | null) {
  return (name || "?").split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export const NOTIF_EMOJI: Record<string, string> = {
  lead: "💸", team_reply: "💬", revision_created: "📝", revision_done: "✅", revision_update: "🛠️",
  escalation: "🚨", upgrade_request: "💰", referral: "🤝", site_live: "🎉", report: "📈", offer: "🕷️",
};
