"use client"

/**
 * Three phases, one component: credentials, then either "scan this QR"
 * (first login — no TOTP secret exists yet) or "enter your code"
 * (every login after). `loginAction`'s return value decides which of
 * the last two the visitor sees; nothing here decides that itself.
 * `useActionState`'s state persists across renders for the lifetime of
 * this component, so once `loginState.step` is set the credentials form
 * below simply never renders again — no extra state needed to "remember"
 * that login succeeded.
 */

import { useActionState } from "react"
import {
  loginAction,
  verifyTotpAction,
  type LoginState,
  type VerifyState,
} from "@/server/auth/actions"

const initialLoginState: LoginState = {}
const initialVerifyState: VerifyState = {}

export default function StaffLoginForm() {
  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    initialLoginState,
  )
  const [verifyState, verifyFormAction, verifyPending] = useActionState(
    verifyTotpAction,
    initialVerifyState,
  )

  if (!loginState.step) {
    return (
      <form className="stack" action={loginFormAction}>
        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="username"
            defaultValue={loginState.email ?? ""}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span className="field__label">Password</span>
          <input
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {loginState.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {loginState.error}
          </p>
        )}
        <button
          className="btn btn--block"
          type="submit"
          disabled={loginPending}
        >
          {loginPending ? "Checking…" : "Continue"}
        </button>
      </form>
    )
  }

  return (
    <div className="stack">
      {loginState.step === "enroll" && loginState.enroll && (
        <div className="stack--tight">
          <p className="small">
            First time signing in — set up two-step verification. Scan this with
            Google Authenticator, 1Password, or any authenticator app.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- a locally generated data: URI, not a remote image next/image would optimize */}
          <img
            src={loginState.enroll.qrDataUrl}
            alt="Scan with your authenticator app"
            width={200}
            height={200}
            style={{ alignSelf: "center" }}
          />
          <p className="meta">
            Can&rsquo;t scan it? Enter this code by hand:{" "}
            <span className="font-mono">{loginState.enroll.secret}</span>
          </p>
        </div>
      )}
      <form className="stack" action={verifyFormAction}>
        <label className="field">
          <span className="field__label">6-digit code</span>
          <input
            className="input font-mono"
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            required
            autoFocus
          />
        </label>
        {verifyState.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {verifyState.error}
          </p>
        )}
        <button
          className="btn btn--block"
          type="submit"
          disabled={verifyPending}
        >
          {verifyPending ? "Checking…" : "Verify and sign in"}
        </button>
      </form>
    </div>
  )
}
