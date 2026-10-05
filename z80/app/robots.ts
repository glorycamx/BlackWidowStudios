import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/live", "/routines", "/calendar", "/chat", "/jobs", "/team", "/approvals", "/activity", "/memory", "/apps", "/settings", "/onboarding", "/api"] }],
    sitemap: `${site.url}/sitemap.xml`,
  };
}
