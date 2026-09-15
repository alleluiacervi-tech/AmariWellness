"use client"

/**
 * Reveals its children in a short stagger rather than fading the
 * whole block as one unit — the previous behaviour animated every
 * section identically, which read as a tic rather than as pacing.
 *
 * Children are visible by default if the observer never runs, so a
 * failed script or a jump-scroll can't leave the page blank.
 */

import { useEffect, useRef } from "react"
import type { ReactNode } from "react"
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode
  className?: string
  as?: "div" | "section"
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible")
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible")
            observer.disconnect()
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref as never}
      className={`reveal${className ? " " + className : ""}`}
    >
      {children}
    </Tag>
  )
}
