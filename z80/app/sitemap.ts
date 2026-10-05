import type { MetadataRoute } from "next";
import { site } from "@/config/site";
import { agents } from "@/data/bots";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/pricing", "/security", "/company", "/privacy", "/terms", "/login", "/signup"];
  return [...pages.map((p) => ({ url: `${site.url}${p}` })), ...agents.map((a) => ({ url: `${site.url}/bots/${a.slug}` }))];
}
