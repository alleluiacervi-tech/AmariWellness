"use client"

import { useActionState } from "react"
import { addSocialLink, type ActionState } from "@/server/admin/actions"

const initial: ActionState = {}

export default function SocialLinkForm() {
  const [state, formAction, pending] = useActionState(addSocialLink, initial)

  return (
    <form className="form-grid" action={formAction} style={{ alignItems: "end" }}>
      <label className="field">
        <span className="field__label">Platform</span>
        <input className="input" name="platform" required maxLength={30} placeholder="e.g. tiktok" />
      </label>
      <label className="field">
        <span className="field__label">Label</span>
        <input className="input" name="label" required maxLength={40} placeholder="e.g. TikTok" />
      </label>
      <label className="field">
        <span className="field__label">URL</span>
        <input className="input" name="url" type="url" required maxLength={300} placeholder="https://…" />
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
