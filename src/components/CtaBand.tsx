import type { ReactNode } from "react"
import Link from "@/components/Link"
import { Arrow } from "@/components/icons"

/** The end of an inner page: one clear next step, never a dead end. */
export default function CtaBand({
  label,
  title,
  body,
  href = "/book",
  cta = "Book a session",
  secondary,
  surface = "surface-mist",
}: {
  label: string
  title: ReactNode
  body?: ReactNode
  href?: string
  cta?: string
  secondary?: ReactNode
  surface?: string
}) {
  return (
    <section className={surface} aria-label={label}>
      <div className="wrap cta-band__inner">
        <div className="cta-band__copy">
          <p className="label">{label}</p>
          <h2 className="h2">{title}</h2>
          {body && <p className="body">{body}</p>}
        </div>
        <div className="cluster">
          <Link className="btn" href={href}>
            {cta} <Arrow />
          </Link>
          {secondary}
        </div>
      </div>
    </section>
  )
}
