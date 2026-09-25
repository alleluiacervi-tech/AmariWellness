/* One stroke weight, one grid (24px), currentColor throughout — the
   icons take the colour of whatever surface they sit on. */

import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement>

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const

export function Arrow({ className = "arrow", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M4 12h15M13.5 6.5 19 12l-5.5 5.5" />
    </svg>
  )
}

export function ArrowLeft({ className = "arrow", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M20 12H5M10.5 6.5 5 12l5.5 5.5" />
    </svg>
  )
}

export function ArrowOut({ className = "arrow", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

export function Check({ className = "check", ...props }: IconProps) {
  return (
    <svg {...base} strokeWidth={1.6} className={className} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

export function Close({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

/** A door with a key-turn: the suite locks from the inside. */
export function Door({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M6 21V4.5A1.5 1.5 0 0 1 7.5 3h9A1.5 1.5 0 0 1 18 4.5V21M3.5 21h17" />
      <circle cx="14.5" cy="12.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  )
}

/** Three faders: intensity is yours to set. */
export function Sliders({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M6 4v16M12 4v16M18 4v16" />
      <circle cx="6" cy="14" r="2" fill="var(--s-ground)" />
      <circle cx="12" cy="8" r="2" fill="var(--s-ground)" />
      <circle cx="18" cy="16" r="2" fill="var(--s-ground)" />
    </svg>
  )
}

/** A cup, steam optional: the lounge afterwards. */
export function Cup({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M4.5 10h12v4.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V10ZM16.5 11.5h1.25a2.25 2.25 0 0 1 0 4.5H16M9 3.5c-.8 1 .8 2 0 3M12.5 3.5c-.8 1 .8 2 0 3" />
    </svg>
  )
}

export function Pin({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  )
}

export function Calendar({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  )
}

export function Chat({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M20.5 12a8.5 8.5 0 0 1-12.4 7.55L3.5 20.5l1-4.3A8.5 8.5 0 1 1 20.5 12Z" />
    </svg>
  )
}

export function Mail({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6 8.5-6" />
    </svg>
  )
}

export function Phone({ className = "icon", ...props }: IconProps) {
  return (
    <svg {...base} className={className} {...props}>
      <path d="M8.2 3.5 5.6 4.3a1.8 1.8 0 0 0-1.2 2c.9 6.4 6.9 12.4 13.3 13.3a1.8 1.8 0 0 0 2-1.2l.8-2.6a1.2 1.2 0 0 0-.6-1.4l-3-1.5a1.2 1.2 0 0 0-1.4.3l-1.1 1.3a9.8 9.8 0 0 1-4.8-4.8l1.3-1.1a1.2 1.2 0 0 0 .3-1.4L9.6 4.1a1.2 1.2 0 0 0-1.4-.6Z" />
    </svg>
  )
}
