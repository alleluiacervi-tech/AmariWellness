'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface FigureProps {
  src: string
  alt: string
  eager?: boolean
  className?: string
  aspectRatio?: string
  sizes?: string
}

export function Figure({
  src,
  alt,
  eager = false,
  className = '',
  sizes = '100vw',
}: FigureProps) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        className={`figure-fallback ${className}`}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '240px',
          backgroundColor: '#233027',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          color: '#d4af37',
        }}
        role="img"
        aria-label={alt}
      >
        <span style={{ fontSize: '11px', letterSpacing: '0.24em', textTransform: 'uppercase', opacity: 0.8 }}>
          Amari Wellness
        </span>
        <span style={{ fontSize: '14px', fontStyle: 'italic', fontFamily: 'var(--font-serif)', color: '#faf8f4', marginTop: '8px' }}>
          {alt}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`figure-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#1f2e24',
      }}
    >
      {!loaded && !eager && (
        <div
          className="figure-shimmer"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #1c3528 0%, #264333 50%, #1c3528 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.8s infinite',
          }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={eager}
        loading={eager ? undefined : 'lazy'}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        style={{
          objectFit: 'cover',
          opacity: loaded || eager ? 1 : 0,
          transition: 'opacity 0.45s ease-in-out, transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      />
    </div>
  )
}

export default Figure
