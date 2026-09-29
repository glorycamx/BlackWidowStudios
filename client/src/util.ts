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
  if (h < 1) return `due in ${Math.max(1, Math.round(ms / 60000))} min`;
  if (h < 24) return `due in ${Math.round(h)} hr`;
  return `due by ${new Date(iso).toLocaleDateString("en-US", { weekday: "long" })}`;
}

// (603) 555-0199 for US numbers; anything else is shown as typed
export function formatPhone(p: string | null | undefined) {
  if (!p) return "";
  const d = p.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : p;
}

// "48-hour" -> "48 hours", "Same-day" -> "the same day"
export function turnaround(label: string) {
  return /same/i.test(label) ? "the same day" : label.replace(/-hour$/i, " hours");
}

// "/sprinkler-repair" -> "Sprinkler repair"
export function pageName(path: string) {
  if (!path || path === "/") return "Home";
  const s = decodeURIComponent(path.split("/").filter(Boolean).pop() || path).replace(/[-_]+/g, " ").replace(/\.html?$/, "");
  return s.charAt(0).toUpperCase() + s.slice(1);
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

