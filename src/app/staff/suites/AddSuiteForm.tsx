"use client"

import { useActionState } from "react"
import { addSuite, type ActionState } from "@/server/admin/actions"

const initial: ActionState = {}

export default function AddSuiteForm() {
  const [state, formAction, pending] = useActionState(addSuite, initial)

  return (
    <form className="form-grid" action={formAction} style={{ alignItems: "end" }}>
      <label className="field">
        <span className="field__label">New suite name</span>
        <input className="input" name="name" required maxLength={40} placeholder="e.g. Suite 5" />
      </label>
      <div className="stack--tight">
        {state.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {state.error}
          </p>
        )}
        <button className="btn btn--outline btn--sm" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add suite"}
        </button>
      </div>
    </form>
  )
}
