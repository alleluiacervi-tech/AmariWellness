"use client"

import { useActionState } from "react"
import Bloom from "@/components/Bloom"
import { requestOtp, verifyOtpAndSignInAccount, type OtpRequestState, type VerifyAccountState } from "@/server/client-auth/actions"

const otpInitial: OtpRequestState = {}
const verifyInitial: VerifyAccountState = {}

export default function AccountLoginForm() {
  const [otpState, otpAction, otpPending] = useActionState(requestOtp, otpInitial)
  const [verifyState, verifyAction, verifyPending] = useActionState(verifyOtpAndSignInAccount, verifyInitial)

  if (!otpState.sent) {
    return (
      <form className="stack" action={otpAction}>
        <label className="field">
          <span className="field__label">Phone number</span>
          <input
            className="input input--mono"
            name="phone"
            type="tel"
            required
            pattern={"\\+?[0-9 ]{7,20}"}
            maxLength={20}
            autoFocus
            placeholder="+250 7__ ___ ___"
          />
        </label>
        {otpState.error && (
          <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
            {otpState.error}
          </p>
        )}
        <button className="btn btn--block" type="submit" disabled={otpPending}>
          {otpPending ? "Sending…" : "Send code"}
        </button>
      </form>
    )
  }

  return (
    <div className="stack">
      {otpState.devCode && (
        <div className="notice">
          <Bloom />
          <div>
            <strong>Sandbox mode — no SMS provider is connected yet</strong>
            <p>
              Your code is <span className="font-mono">{otpState.devCode}</span>.
            </p>
          </div>
        </div>
      )}
      <form className="stack" action={verifyAction}>
        <input type="hidden" name="phone" value={otpState.phone} />
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
        <button className="btn btn--block" type="submit" disabled={verifyPending}>
          {verifyPending ? "Checking…" : "Verify and sign in"}
        </button>
      </form>
    </div>
  )
}
