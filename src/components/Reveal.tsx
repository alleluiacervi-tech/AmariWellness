"use client"

/** Progressive enhancement: content stays visible without JavaScript or motion. */

import { useEffect, useRef } from "react"
import type { CSSProperties, ReactNode } from "react"
export default function Reveal({
  children,
  className = "",
  as: Tag = "div",
  style,
  stagger = false,
}: {
  children: ReactNode
  className?: string
  as?: "div" | "section"
  style?: CSSProperties
  stagger?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !("IntersectionObserver" in window)) return
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)")
    if (preference.matches) return
    const animations: Animation[] = []
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        if (preference.matches) return
        const targets = stagger ? Array.from(el.children) : [el]
        targets.forEach((target, index) => {
          animations.push(
            target.animate(
              [
                { opacity: 0.35, transform: "translateY(14px)" },
                { opacity: 1, transform: "translateY(0)" },
              ],
              {
                duration: 620,
                delay: stagger ? Math.min(index * 85, 255) : 0,
                easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
                fill: "backwards",
              },
            ),
          )
        })
      },
      { threshold: 0.08 },
    )
    const stop = () => {
      if (preference.matches)
        animations.forEach((animation) => animation.cancel())
    }
    preference.addEventListener("change", stop)
    observer.observe(el)
    return () => {
      observer.disconnect()
      animations.forEach((animation) => animation.cancel())
      preference.removeEventListener("change", stop)
    }
  }, [stagger])

  return (
    <Tag ref={ref as never} className={className} style={style}>
      {children}
    </Tag>
  )
}
