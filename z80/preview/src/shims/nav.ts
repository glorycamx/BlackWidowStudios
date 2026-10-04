/**
 * In-memory router used by the single-file preview build. Stands in for the
 * Next.js App Router: same useRouter / usePathname / useSearchParams surface.
 */
import { useSyncExternalStore } from "react";

interface Loc {
  path: string;
  search: string;
  hash: string;
}

let loc: Loc = { path: "/", search: "", hash: "" };
const subs = new Set<() => void>();

function parse(href: string): Loc {
  const [beforeHash, hash = ""] = href.split("#");
  const [path, search = ""] = beforeHash.split("?");
  return { path: path || loc.path, search, hash };
}

function scrollToHash(hash: string) {
  const tryScroll = (n: number) => {
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else if (n > 0) setTimeout(() => tryScroll(n - 1), 120);
  };
  tryScroll(10);
}

export function navigate(href: string, opts: { replace?: boolean } = {}) {
  if (/^https?:/.test(href)) {
    window.open(href, "_blank", "noopener");
    return;
  }
  if (href.startsWith("#")) {
    scrollToHash(href.slice(1));
    return;
  }
  const next = parse(href);
  const samePage = next.path === loc.path && next.search === loc.search;
  loc = next;
  subs.forEach((f) => f());
  if (next.hash) setTimeout(() => scrollToHash(next.hash), samePage ? 0 : 200);
  else if (!samePage && !opts.replace) window.scrollTo(0, 0);
}

const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export function useLocation(): Loc {
  return useSyncExternalStore(subscribe, () => loc, () => loc);
}
