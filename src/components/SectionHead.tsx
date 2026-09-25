import type { ReactNode } from "react"
import Reveal from "@/components/Reveal"

/** Label, serif title, optional intro — and an optional link aligned right. */
export default function SectionHead({
  id,
  label,
  title,
  intro,
  action,
}: {
  id?: string
  label: ReactNode
  title: ReactNode
  intro?: ReactNode
  action?: ReactNode
}) {
  return (
    <Reveal className="section-head">
      <div className="section-head__copy">
        <p className="label">{label}</p>
        <h2 className="h2" id={id}>
          {title}
        </h2>
        {intro && <p className="body">{intro}</p>}
      </div>
      {action}
    </Reveal>
  )
}
