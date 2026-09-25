import type { ReactNode } from "react"

export interface FaqItem {
  q: string
  a: string
}

/**
 * Native <details>: keyboard, screen-reader and no-JS support for free.
 * A shared `name` makes the group exclusive — opening one closes the rest.
 */
export default function Faq({
  items,
  label,
  title,
  name,
  children,
}: {
  items: FaqItem[]
  label: string
  title: ReactNode
  name: string
  children?: ReactNode
}) {
  const titleId = `${name}-title`
  return (
    <section className="faq-section" aria-labelledby={titleId}>
      <div className="faq-section__head">
        <p className="label">{label}</p>
        <h2 className="h2" id={titleId}>
          {title}
        </h2>
        {children}
      </div>
      <div className="faq">
        {items.map((item) => (
          <details className="faq__item" name={name} key={item.q}>
            <summary className="faq__q">
              {item.q}
              <span className="faq__icon" aria-hidden="true" />
            </summary>
            <div className="faq__a">
              <p>{item.a}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
