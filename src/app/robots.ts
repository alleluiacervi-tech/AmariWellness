import type { MetadataRoute } from "next"
import { SITE_CONFIG } from "@/data/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/staff", "/account"] },
    sitemap: `${SITE_CONFIG.url}/sitemap.xml`,
  }
}
