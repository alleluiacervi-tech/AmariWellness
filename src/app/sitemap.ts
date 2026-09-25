import type { MetadataRoute } from "next"
import { ARTICLES, isoDate } from "@/data/journal"
import { SITE_URL } from "@/lib/metadata"

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/space", "/sessions", "/packs", "/book", "/contact", "/journal"]
  return [
    ...pages.map((path) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path === "/book" ? 0.9 : 0.7,
    })),
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/journal/${a.slug}`,
      lastModified: isoDate(a.date),
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ]
}
