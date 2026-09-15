import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
  title: "Book a chair",
  description:
    "Book a private automated massage suite in Kimihurura, Kigali. Three steps, paid when you book, free cancellation up to four hours before.",
}

export default function BookLayout({ children }: { children: ReactNode }) {
  return children
}
