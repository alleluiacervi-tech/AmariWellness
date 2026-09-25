import type { MetadataRoute } from "next"
import { ARTICLES, isoDate } from "@/data/journal"
import { SITE_CONFIG } from "@/data/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/space", "/sessions", "/packs", "/book", "/contact", "/journal"]
  return [
    ...pages.map((path) => ({
      url: `${SITE_CONFIG.url}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path === "/book" ? 0.9 : 0.7,
    })),
    ...ARTICLES.map((a) => ({
      url: `${SITE_CONFIG.url}/journal/${a.slug}`,
      lastModified: isoDate(a.date),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ]
}
