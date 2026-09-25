import type { ReactNode } from "react"

/** Serif title, optional intro — and an optional link aligned right. */
export default function SectionHead({
  id,
  title,
  intro,
  action,
}: {
  id?: string
  title: ReactNode
  intro?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="section-head">
      <div className="section-head__copy">
        <h2 className="h2" id={id}>
          {title}
        </h2>
        {intro && <p className="body">{intro}</p>}
      </div>
      {action}
    </div>
  )
}
