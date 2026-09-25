import type { Metadata } from "next"

/* Next merges metadata shallowly: a page that sets `title` but not
   `openGraph` inherits the root's share card wholesale. Build every
   page's metadata here so title, canonical and card always agree. */

/**
 * The domain, not business content — a deploy-time setting (Phase 0's
 * "confirm real domain" item, see CLAUDE.md §6), not something an admin
 * edits alongside prices or hours. Kept as a constant rather than a
 * `locations` column so canonical URLs, the sitemap and robots.txt never
 * need a database call to render.
 */
export const SITE_URL = "https://amari.rw" // TODO: confirm domain (Phase 0)

export const OPEN_GRAPH_BASE = {
  siteName: "Amari Kigali",
  locale: "en_RW",
  type: "website",
} as const

export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string
  description: string
  path: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      title: `${title} | Amari Kigali`,
      description,
      url: path,
    },
  }
}
