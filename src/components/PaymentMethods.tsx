/* Local vector marks: no external image requests, and each mark sits
   beside its visible name, so the SVGs are decorative. Third-party marks
   keep their own colours (see the --payment-* tokens). */

import type { ReactNode } from "react"

export const PAYMENT_METHODS = ["MTN MoMo", "Airtel Money", "Visa", "Mastercard"] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

const MARKS: Record<PaymentMethod, ReactNode> = {
  "MTN MoMo": (
    <svg
      className="payment-icon payment-icon--mtn"
      viewBox="0 0 64 40"
      aria-hidden="true"
    >
      <rect width="64" height="40" rx="5" fill="currentColor" />
      <ellipse
        cx="32"
        cy="20"
        rx="24"
        ry="12"
        fill="none"
        stroke="var(--payment-ink)"
        strokeWidth="2"
      />
      <text
        x="32"
        y="25"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="15"
        fill="var(--payment-ink)"
      >
        MTN
      </text>
    </svg>
  ),
  "Airtel Money": (
    <svg
      className="payment-icon payment-icon--airtel"
      viewBox="0 0 64 40"
      aria-hidden="true"
    >
      <rect width="64" height="40" rx="5" fill="currentColor" />
      <path
        d="M22 8h15v24H22z M27 28h5 M27 12h5"
        fill="none"
        stroke="var(--payment-white)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M42 16a6 6 0 0 1 0 8 M46 12a12 12 0 0 1 0 16"
        fill="none"
        stroke="var(--payment-white)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  ),
  "Visa": (
    <svg
      className="payment-icon payment-icon--visa"
      viewBox="0 0 64 40"
      aria-hidden="true"
    >
      <rect
        x="0.5"
        y="0.5"
        width="63"
        height="39"
        rx="5"
        fill="var(--payment-white)"
        stroke="var(--s-rule-2)"
      />
      <text
        x="32"
        y="27"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="900"
        fontStyle="italic"
        fontSize="23"
        fill="currentColor"
      >
        VISA
      </text>
    </svg>
  ),
  "Mastercard": (
    <svg className="payment-icon" viewBox="0 0 64 40" aria-hidden="true">
      <rect
        x="0.5"
        y="0.5"
        width="63"
        height="39"
        rx="5"
        fill="var(--payment-white)"
        stroke="var(--s-rule-2)"
      />
      <circle
        cx="25"
        cy="20"
        r="12"
        fill="var(--payment-mastercard-red)"
      />
      <circle
        cx="39"
        cy="20"
        r="12"
        fill="var(--payment-mastercard-gold)"
      />
      <path
        d="M32 10.25a12 12 0 0 1 0 19.5 12 12 0 0 1 0-19.5"
        fill="var(--payment-mastercard-overlap)"
      />
    </svg>
  ),
}

/** One method, as an inline mark + name (safe inside a <label>). */
export function PaymentMark({ method }: { method: PaymentMethod }) {
  return (
    <span className="payment-method">
      {MARKS[method]}
      <span>{method}</span>
    </span>
  )
}

export default function PaymentMethods() {
  return (
    <ul className="payment-methods" aria-label="Payment methods">
      {PAYMENT_METHODS.map((method) => (
        <li key={method}>
          <PaymentMark method={method} />
        </li>
      ))}
    </ul>
  )
}
