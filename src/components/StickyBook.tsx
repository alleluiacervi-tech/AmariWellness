"use client"

/**
 * Mobile-only booking bar. On a phone the primary action otherwise
 * scrolls away within one screen and never comes back until the
 * footer. Appears once the page has moved past its opening.
 */

import { useEffect, useState } from "react"
import Link from "@/components/Link"
export default function StickyBook({
  label,
  price,
  href = "/book",
}: {
  label: string
  price: string
  href?: string
}) {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div
      className={`sticky-book${shown ? " sticky-book--in" : ""}`}
      aria-hidden={!shown}
    >
      <div>
        <span className="sticky-book__label">{label}</span>
        <span className="sticky-book__price">{price}</span>
      </div>
      <Link className="btn" href={href} tabIndex={shown ? undefined : -1}>
        Book
      </Link>
    </div>
  )
}
