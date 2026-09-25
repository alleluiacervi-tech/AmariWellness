"use client"

/**
 * next/image with a shimmer while loading and a branded card if the
 * remote asset fails. Shape (arch, ratio) comes in through className;
 * colours come from the surface tokens, never from here.
 */

import { useState } from "react"
import Image from "next/image"
import Bloom from "@/components/Bloom"

export interface FigureProps {
  src: string
  alt: string
  /** Above the fold: preload and skip the shimmer. */
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

  return (
    <div className={`figure ${className}`}>
      {failed ? (
        <div className="figure__fallback" role="img" aria-label={alt}>
          <Bloom />
          <span aria-hidden="true">{alt}</span>
        </div>
      ) : (
        <>
          {!loaded && !eager && (
            <div className="figure__shimmer" aria-hidden="true" />
          )}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            preload={eager}
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            style={{ objectFit: "cover", opacity: loaded || eager ? 1 : 0 }}
          />
        </>
      )}
    </div>
  )
}

export default Figure
