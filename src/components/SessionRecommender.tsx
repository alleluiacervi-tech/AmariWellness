"use client" /* Always shows a recommendation. An empty result panel left a
          third of the section as dead space and hid what the tool does. */

import { useState } from "react"
import Link from "@/components/Link"
import { SESSIONS, PARTNER_SESSIONS } from "@/data/sessions"

const TIME_OPTIONS = [
  { id: "15", label: "15 minutes" },
  { id: "30", label: "30 minutes" },
  { id: "60", label: "An hour" },
  { id: "partner", label: "Coming with someone" },
]

const FOCUS_OPTIONS = [
  { id: "neck", label: "Neck & shoulders" },
  { id: "back", label: "Whole back" },
  { id: "mind", label: "My head, mostly" },
]

const REASONS: Record<string, string> = {
  quick:
    "Short and targeted at the top of your spine — it fits in a lunch break and still makes a difference.",
  half: "Full body, long enough to properly switch off, short enough for a weekday evening. Where most people start.",
  full: "The longest programme, with the stretch sequence at the end. Book it when you have decided to actually stop.",
  "partner-30":
    "Two private rooms side by side, running at the same time. You each set your own programme.",
}

export function SessionRecommender() {
  const [time, setTime] = useState<string | null>(null)
  const [focus, setFocus] = useState<string | null>(null)

  function recommend() {
    if (time === "partner") return PARTNER_SESSIONS[0]
    if (time === "15" || (focus === "neck" && time !== "60")) return SESSIONS[0]
    if (time === "60" || focus === "mind") return SESSIONS[2]
    return SESSIONS[1]
  }

  const rec = recommend()
  const answered = Boolean(time || focus)

  return (
    <div className="recommender">
      <div className="shead">
        <p className="label">Not sure which</p>
        <h2 className="shead__title">Two questions, and we will tell you.</h2>
      </div>

      <div className="recommender-steps">
        <div>
          <span className="recommender-step-label" id="rec-time">
            How much time do you have?
          </span>
          <div
            className="recommender-options"
            role="group"
            aria-labelledby="rec-time"
          >
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={time === opt.id}
                className={`recommender-btn${
                  time === opt.id ? " recommender-btn--selected" : ""
                }`}
                onClick={() => setTime(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="recommender-step-label" id="rec-focus">
            What is bothering you?
          </span>
          <div
            className="recommender-options"
            role="group"
            aria-labelledby="rec-focus"
          >
            {FOCUS_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={focus === opt.id}
                className={`recommender-btn${
                  focus === opt.id ? " recommender-btn--selected" : ""
                }`}
                onClick={() => setFocus(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="recommender-result" role="status" aria-live="polite">
        <div>
          <p className="label">
            {answered ? "Book this one" : "Where most people start"}
          </p>
          <h3 className="recommender-result-name">{rec.name}</h3>
          <p className="recommender-result-meta">
            {rec.duration} &middot; {rec.price}
          </p>
          <p className="recommender-result-desc">{REASONS[rec.id]}</p>
        </div>
        <Link href={`/book?session=${rec.id}`} className="btn btn--solid">
          Book it
          <span className="tlink__arrow" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </div>
    </div>
  )
}

export default SessionRecommender
