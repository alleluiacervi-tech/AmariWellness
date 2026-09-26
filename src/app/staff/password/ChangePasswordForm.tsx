"use client"

import { useActionState } from "react"
import { changePasswordAction, type ChangePasswordState } from "@/server/auth/actions"

const initial: ChangePasswordState = {}

export default function ChangePasswordForm({ email, minLength }: { email: string; minLength: number }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initial)

  return (
    <form className="form-card stack" action={formAction}>
      {/* Lets a password manager file the new password under the right account. */}
      <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
      <label className="field">
        <span className="field__label">Current password</span>
        <input className="input" type="password" name="currentPassword" autoComplete="current-password" required />
      </label>
      <label className="field">
        <span className="field__label">New password</span>
        <input
          className="input"
          type="password"
          name="newPassword"
          autoComplete="new-password"
          minLength={minLength}
          required
        />
      </label>
      <label className="field">
        <span className="field__label">New password again</span>
        <input
          className="input"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={minLength}
          required
        />
      </label>
      {state.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="small" role="status">
          Password changed.
          {state.otherSessionsEnded
            ? ` ${state.otherSessionsEnded} other ${state.otherSessionsEnded === 1 ? "device was" : "devices were"} signed out.`
            : ""}
        </p>
      )}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  )
}
