import { useMemo } from "react";
import { navigate, useLocation } from "./nav";

const router = {
  push: (href: string) => navigate(href),
  replace: (href: string) => navigate(href, { replace: true }),
  back: () => navigate("/"),
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
};

export function useRouter() {
  return router;
}

export function usePathname() {
  return useLocation().path;
}

export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export function notFound(): never {
  throw new Error("not-found");
}
