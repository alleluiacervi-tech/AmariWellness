"use client"

/**
 * The structured content blocks (hygiene protocol, visit steps, the
 * shelf) — edited as raw JSON for now rather than a bespoke form per
 * shape. A deliberate simplification: real editing, just not the
 * friendliest UI yet. See CLAUDE.md P1.3 for the plan to replace this
 * with per-field forms.
 */

import { useActionState } from "react"
import { updateJsonBlock, type ActionState } from "@/server/admin/actions"

const initial: ActionState = {}

export default function JsonBlockForm({
  blockKey,
  label,
  hint,
  value,
}: {
  blockKey: string
  label: string
  hint: string
  value: unknown
}) {
  const [state, formAction, pending] = useActionState(updateJsonBlock, initial)

  return (
    <form className="stack--tight" action={formAction}>
      <input type="hidden" name="key" value={blockKey} />
      <label className="field">
        <span className="field__label">{label}</span>
        <textarea
          className="input input--mono"
          name="value"
          defaultValue={JSON.stringify(value, null, 2)}
          required
          rows={8}
        />
        <span className="field__hint">{hint}</span>
      </label>
      {state.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {state.error}
        </p>
      )}
      {state.ok && <p className="small">Saved.</p>}
      <button className="btn btn--outline btn--sm" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  )
}
