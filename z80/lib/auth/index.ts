/**
 * Auth provider boundary.
 *
 * THIS IS NOT REAL AUTHENTICATION. The mock provider stores a display name
 * in localStorage so the demo can show signed-in UI. It verifies nothing and
 * protects nothing. Plug Clerk, Auth0, Supabase etc. in by implementing
 * `AuthProvider` and returning it from `getAuthProvider()`.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthProvider {
  readonly id: string;
  /** True when the provider performs real credential verification. */
  readonly secure: boolean;
  getUser(): Promise<AuthUser | null>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(name: string, email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
}

const KEY = "z80.mock-auth.v1";

const mockProvider: AuthProvider = {
  id: "mock",
  secure: false,
  async getUser() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  },
  async signIn(email) {
    const name = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
    const user = { id: "demo-user", name: name || "Operator", email };
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable */
    }
    return user;
  },
  async signUp(name, email) {
    const user = { id: "demo-user", name: name || "Operator", email };
    try {
      localStorage.setItem(KEY, JSON.stringify(user));
    } catch {
      /* storage unavailable */
    }
    return user;
  },
  async signOut() {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export function getAuthProvider(): AuthProvider {
  // Swap on process.env.Z80_AUTH_PROVIDER once a real provider is integrated.
  return mockProvider;
}
