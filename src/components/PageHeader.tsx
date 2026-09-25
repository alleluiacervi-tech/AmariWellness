import type { ReactNode } from "react"
import Figure from "@/components/Figure"
import type { SiteImage } from "@/data/images"

/**
 * Every inner page opens the same way: a label, a serif title, a lead,
 * and — when there is a photograph worth leading with — an arched frame.
 */
export default function PageHeader({
  label,
  title,
  lead,
  media,
  surface = "surface-paper",
  children,
}: {
  /** Only when it tells the reader something the title does not. */
  label?: ReactNode
  title: ReactNode
  lead?: ReactNode
  media?: SiteImage
  surface?: string
  children?: ReactNode
}) {
  return (
    <header className={`page-head ${media ? "page-head--media" : ""} ${surface}`}>
      <div className="wrap page-head__inner">
        <div className="page-head__copy enter">
          {label && <p className="label">{label}</p>}
          <h1 className="h1">{title}</h1>
          {lead && <p className="lead">{lead}</p>}
          {children && <div className="page-head__actions">{children}</div>}
        </div>
        {media && (
          <div className="page-head__media enter-media">
            <Figure
              {...media}
              eager
              className="arch ratio-5x4"
              sizes="(max-width: 860px) 100vw, 46vw"
            />
          </div>
        )}
      </div>
    </header>
  )
}
