"use client"

import { useActionState } from "react"
import { updateTextBlock, type ActionState } from "@/server/admin/actions"

const initial: ActionState = {}

export default function TextBlockForm({
  blockKey,
  label,
  value,
}: {
  blockKey: string
  label: string
  value: string
}) {
  const [state, formAction, pending] = useActionState(updateTextBlock, initial)

  return (
    <form className="stack--tight" action={formAction}>
      <input type="hidden" name="key" value={blockKey} />
      <label className="field">
        <span className="field__label">{label}</span>
        <textarea className="input" name="value" defaultValue={value} required rows={2} maxLength={1000} />
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
