"use client"

import { useActionState } from "react"
import { addHoliday, type ActionState } from "@/server/admin/actions"

const initial: ActionState = {}

export default function HolidayForm() {
  const [state, formAction, pending] = useActionState(addHoliday, initial)

  return (
    <form className="form-grid" action={formAction} style={{ alignItems: "end" }}>
      <label className="field">
        <span className="field__label">Date</span>
        <input className="input" name="date" type="date" required />
      </label>
      <label className="field">
        <span className="field__label">Label</span>
        <input className="input" name="label" required maxLength={80} placeholder="e.g. Christmas Day" />
      </label>
      <label className="field" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <input type="checkbox" name="closed" defaultChecked />
        <span className="field__label" style={{ margin: 0 }}>
          Closed all day
        </span>
      </label>
      <div className="stack--tight">
        {state.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {state.error}
          </p>
        )}
        <button className="btn btn--outline btn--sm" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
    </form>
  )
}
