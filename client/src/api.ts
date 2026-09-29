import { demoRequest } from "./demo";

export const DEMO = import.meta.env.VITE_DEMO === "1";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  if (DEMO) return demoRequest(method, path, body) as Promise<T>;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    window.dispatchEvent(new CustomEvent("bw:api-error", { detail: "You're offline or the connection dropped. Try again." }));
    throw new ApiError(0, "No connection");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Session ended (password reset, signed out elsewhere): send the app back to sign-in
    if (res.status === 401 && !path.startsWith("/auth/")) window.dispatchEvent(new Event("bw:signed-out"));
    if (res.status >= 500 || res.status === 429) window.dispatchEvent(new CustomEvent("bw:api-error", { detail: data.error || "Something went wrong. Try again in a moment." }));
    throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const get = <T = any>(p: string) => api<T>("GET", p);
export const post = <T = any>(p: string, b?: unknown) => api<T>("POST", p, b ?? {});
export const patch = <T = any>(p: string, b: unknown) => api<T>("PATCH", p, b);
export const del = <T = any>(p: string) => api<T>("DELETE", p);
