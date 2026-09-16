"use client"

import { useState } from "react"
import Link from "@/components/Link"
import { SESSIONS } from "@/data/sessions"

const OPTIONS = [
  { id: "quick", label: "A lunch break", meta: "15 MIN" },
  { id: "half", label: "A weekday evening", meta: "30 MIN" },
  { id: "full", label: "A proper stop", meta: "60 MIN" },
]

export default function SessionRecommender() {
  const [picked, setPicked] = useState<string | null>(null)
  const result = SESSIONS.find((s) => s.id === picked)

  return (
    <div className="rail">
      <div className="rail__label">
        <p className="label">Which one</p>
      </div>
      <div className="rail__body stack" style={{ gap: 28 }}>
        <h2 className="h2">How long have you actually got?</h2>
        <div className="grid-3" style={{ gap: 12 }}>
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              className="choice"
              aria-pressed={picked === o.id}
              onClick={() => setPicked(o.id)}
              style={{ flexDirection: "column", alignItems: "flex-start", minHeight: 96 }}
            >
              <span className="data">{o.meta}</span>
              <span className="h3">{o.label}</span>
            </button>
          ))}
        </div>

        {result && (
          <div className="surface-dark rise" style={{ padding: 30, display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 320px" }}>
              <p className="label">We would book you</p>
              <h3 className="h2" style={{ margin: "8px 0 10px" }}>{result.name}</h3>
              <p className="meta" style={{ maxWidth: "48ch" }}>{result.suits}</p>
            </div>
            <div className="stack" style={{ gap: 14, alignItems: "flex-start" }}>
              <span className="data--lg">{result.price}</span>
              <Link className="btn" href={`/book?session=${result.id}`}>Book it</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
