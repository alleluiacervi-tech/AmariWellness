"use client"

import { useActionState } from "react"
import { addFaq, type ActionState } from "@/server/admin/actions"

const initial: ActionState = {}

export default function AddFaqForm({ group }: { group: string }) {
  const [state, formAction, pending] = useActionState(addFaq, initial)

  return (
    <form className="stack--tight" action={formAction}>
      <input type="hidden" name="group" value={group} />
      <label className="field">
        <span className="field__label">New question</span>
        <input className="input" name="question" required maxLength={200} placeholder="e.g. Can I bring a guest?" />
      </label>
      <label className="field">
        <span className="field__label">Answer</span>
        <textarea className="input" name="answer" required rows={2} maxLength={1000} />
      </label>
      {state.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {state.error}
        </p>
      )}
      <button className="btn btn--outline btn--sm" type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add question"}
      </button>
    </form>
  )
}
