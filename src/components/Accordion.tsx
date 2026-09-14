'use client'

import { useState, useId } from 'react'

export interface AccordionItemData {
  q: string
  a: string
}

export interface AccordionProps {
  items: AccordionItemData[]
  className?: string
}

export function Accordion({ items, className = '' }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const baseId = useId()

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={`accordion-group ${className}`} role="region">
      {items.map((item, i) => {
        const isOpen = openIndex === i
        const headerId = `${baseId}-header-${i}`
        const panelId = `${baseId}-panel-${i}`

        return (
          <div key={i} className={`accordion-item${isOpen ? ' accordion-item--open' : ''}`}>
            <h3>
              <button
                id={headerId}
                type="button"
                className="accordion-trigger"
                onClick={() => toggle(i)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span>{item.q}</span>
                <span className="accordion-icon" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headerId}
                className="accordion-content"
              >
                <p>{item.a}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
