"use client"

/**
 * next/image with a shimmer while loading and a branded card if the
 * remote asset fails. Colours come from the stylesheet, not from
 * hardcoded hex — so it stays correct if the palette moves.
 */

import { useState } from "react"
import Image from "next/image"

export interface FigureProps {
  src: string
  alt: string
  eager?: boolean
  className?: string
  sizes?: string
}
export function Figure({
  src,
  alt,
  eager = false,
  className = "",
  sizes = "100vw",
}: FigureProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`figure__fallback ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="figure__fallback-mark">Amari</span>
        <span className="figure__fallback-alt">{alt}</span>
      </div>
    )
  }

  return (
    <div className={`figure ${className}`}>
      {!loaded && !eager && (
        <div className="figure__shimmer" aria-hidden="true" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={eager}
        loading={eager ? undefined : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          objectFit: "cover",
          opacity: loaded || eager ? 1 : 0,
          transition: "opacity 600ms var(--ease)",
        }}
      />
    </div>
  )
}

export default Figure
