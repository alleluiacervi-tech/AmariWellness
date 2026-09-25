import type { Metadata } from "next"

/* Next merges metadata shallowly: a page that sets `title` but not
   `openGraph` inherits the root's share card wholesale. Build every
   page's metadata here so title, canonical and card always agree. */

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
      title: `${title} · Amari Kigali`,
      description,
      url: path,
    },
  }
}
