"use client"

import { useActionState } from "react"
import { deleteFaq, updateFaq, type ActionState } from "@/server/admin/actions"
import type { FaqRow } from "@/server/db/content"

const initial: ActionState = {}

export default function FaqEditForm({ faq }: { faq: FaqRow }) {
  const [state, formAction, pending] = useActionState(updateFaq, initial)

  return (
    <li className="stack--tight" style={{ borderTop: "1px solid var(--s-rule)", paddingTop: 12 }}>
      <form className="stack--tight" action={formAction}>
        <input type="hidden" name="id" value={faq.id} />
        <label className="field">
          <span className="field__label">Question</span>
          <input className="input" name="question" defaultValue={faq.question} required maxLength={200} />
        </label>
        <label className="field">
          <span className="field__label">Answer</span>
          <textarea className="input" name="answer" defaultValue={faq.answer} required rows={2} maxLength={1000} />
        </label>
        <div className="cluster justify-between">
          <div className="stack--tight">
            {state.error && (
              <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
                {state.error}
              </p>
            )}
            {state.ok && <p className="small">Saved.</p>}
          </div>
          <div className="cluster">
            <button className="btn btn--outline btn--sm" type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
      <form action={deleteFaq.bind(null, faq.id)}>
        <button className="btn btn--outline btn--sm" type="submit">
          Remove
        </button>
      </form>
    </li>
  )
}
