"use client"

import { useState } from "react"

export interface FaqItem {
  q: string
  a: string
}

export default function Faq({ items, label }: { items: FaqItem[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <div className="rail">
      <div className="rail__label">
        <p className="label">{label}</p>
      </div>
      <div className="rail__body">
        {items.map((f, i) => {
          const isOpen = open === i
          return (
            <div key={f.q} className="faq">
              <button
                className="faq__q"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                {f.q}
                <span className="faq__sign" aria-hidden="true">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && <p className="faq__a">{f.a}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
