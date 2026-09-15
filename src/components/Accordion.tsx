"use client"

import { useState, useId } from "react"

export interface AccordionItemData {
  q: string
  a: string
}

export interface AccordionProps {
  items: AccordionItemData[]
  className?: string
}

export function Accordion({ items, className = "" }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const baseId = useId()

  return (
    <div className={`accordion-group ${className}`}>
      {items.map((item, i) => {
        const isOpen = openIndex === i
        const headerId = `${baseId}-h-${i}`
        const panelId = `${baseId}-p-${i}`

        return (
          <div
            key={item.q}
            className={`accordion-item${isOpen ? " accordion-item--open" : ""}`}
          >
            <h3>
              <button
                id={headerId}
                type="button"
                className="accordion-trigger"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span>{item.q}</span>
                <span className="accordion-icon" aria-hidden="true" />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={headerId}
              className="accordion-content"
              hidden={!isOpen}
            >
              <p>{item.a}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
