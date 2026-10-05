import path from "node:path";
import type { NextConfig } from "next";

/** Old routes from before the "bots that never clock out" revamp. */
const legacy: [string, string][] = [
  ["/signals", "/live"],
  ["/command", "/chat"],
  ["/workforce", "/team"],
  ["/workforce/:slug", "/team/:slug"],
  ["/missions", "/jobs"],
  ["/missions/:id", "/jobs/:id"],
  ["/connections", "/apps"],
  ["/agents/:slug", "/bots/:slug"],
  // Old bot names
  ["/team/helm", "/team/manager"],
  ["/team/lookout", "/team/lead-hunter"],
  ["/team/beacon", "/team/content-creator"],
  ["/bots/helm", "/bots/manager"],
  ["/bots/lookout", "/bots/lead-hunter"],
  ["/bots/beacon", "/bots/content-creator"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  turbopack: { root: path.resolve(__dirname) },
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
  },
  async redirects() {
    return legacy.map(([source, destination]) => ({ source, destination, permanent: false }));
  },
};

export default nextConfig;
