"use client"

/**
 * Two independent forms per session: copy (name, description, highlights)
 * and price (a new current price, with a required reason — see the
 * comment on `updateSessionTypePrice`). Kept separate because they're
 * different kinds of action: editing a sentence isn't the same
 * sensitivity as changing what a client pays, and CLAUDE.md §3 only
 * requires a reason for the latter.
 */

import { useActionState } from "react"
import { updateSessionTypeCopy, updateSessionTypePrice, type ActionState } from "@/server/admin/actions"
import type { SessionItem } from "@/server/db/content"

const initial: ActionState = {}

export default function SessionEditForms({ session }: { session: SessionItem }) {
  const [copyState, copyAction, copyPending] = useActionState(updateSessionTypeCopy, initial)
  const [priceState, priceAction, pricePending] = useActionState(updateSessionTypePrice, initial)

  return (
    <article className="form-card" aria-labelledby={`session-${session.uuid}-title`}>
      <div className="cluster justify-between">
        <h2 className="h3" id={`session-${session.uuid}-title`}>
          {session.name}
        </h2>
        <span className="meta">{session.duration}</span>
      </div>

      <form className="stack--tight" action={copyAction}>
        <input type="hidden" name="id" value={session.uuid} />
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Name</span>
            <input className="input" name="name" defaultValue={session.name} required maxLength={80} />
          </label>
          <label className="field">
            <span className="field__label">Label</span>
            <input className="input" name="label" defaultValue={session.label} required maxLength={80} />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Intro (one line, shown in italics)</span>
          <input className="input" name="intro" defaultValue={session.intro} required maxLength={200} />
        </label>
        <label className="field">
          <span className="field__label">Summary (home page card)</span>
          <textarea className="input" name="summary" defaultValue={session.summary} required rows={2} maxLength={400} />
        </label>
        <label className="field">
          <span className="field__label">About (full description)</span>
          <textarea className="input" name="about" defaultValue={session.about} required rows={4} maxLength={1000} />
        </label>
        <label className="field">
          <span className="field__label">Highlights (one per line)</span>
          <textarea
            className="input"
            name="highlights"
            defaultValue={session.highlights.join("\n")}
            required
            rows={3}
          />
        </label>
        {copyState.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {copyState.error}
          </p>
        )}
        {copyState.ok && <p className="small">Saved.</p>}
        <button className="btn btn--outline" type="submit" disabled={copyPending}>
          {copyPending ? "Saving…" : "Save description"}
        </button>
      </form>

      <form className="stack--tight" action={priceAction}>
        <input type="hidden" name="sessionTypeId" value={session.uuid} />
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Standard price (RWF)</span>
            <input
              className="input input--mono"
              name="priceRwf"
              type="number"
              min={0}
              step={100}
              defaultValue={session.priceNumber}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Quiet-hours price (RWF)</span>
            <input
              className="input input--mono"
              name="offPeakPriceRwf"
              type="number"
              min={0}
              step={100}
              defaultValue={session.offPeakNumber}
              required
            />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Reason for this change</span>
          <input className="input" name="reason" required maxLength={300} placeholder="e.g. Seasonal adjustment" />
          <span className="field__hint">
            Required — recorded in the activity log. The old price stays attached to bookings already made.
          </span>
        </label>
        {priceState.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {priceState.error}
          </p>
        )}
        {priceState.ok && <p className="small">Saved — the new price is live.</p>}
        <button className="btn" type="submit" disabled={pricePending}>
          {pricePending ? "Saving…" : "Update price"}
        </button>
      </form>
    </article>
  )
}
