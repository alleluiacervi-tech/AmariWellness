import type { ReactNode } from "react"
import Link from "@/components/Link"

/** The end of an inner page: one clear next step, never a dead end. */
export default function CtaBand({
  name,
  title,
  body,
  href = "/book",
  cta = "Book a session",
  secondary,
  surface = "surface-stone",
}: {
  /** Accessible name for the region; not shown. */
  name: string
  title: ReactNode
  body?: ReactNode
  href?: string
  cta?: string
  secondary?: ReactNode
  surface?: string
}) {
  return (
    <section className={surface} aria-label={name}>
      <div className="wrap cta-band__inner">
        <div className="cta-band__copy">
          <h2 className="h2">{title}</h2>
          {body && <p className="body">{body}</p>}
        </div>
        <div className="cluster">
          <Link className="btn" href={href}>
            {cta}
          </Link>
          {secondary}
        </div>
      </div>
    </section>
  )
}
