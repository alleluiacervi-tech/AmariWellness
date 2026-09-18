/** Local vector marks avoid external image requests; visible names identify each method. */
export default function PaymentMethods({ method }: { method?: string }) {
  return (
    <ul className="payment-methods" aria-label="Payment methods">
      {(!method || method === "MTN MoMo") && (
        <li className="payment-method">
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
          <span>MTN MoMo</span>
        </li>
      )}
      {(!method || method === "Airtel Money") && (
        <li className="payment-method">
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
          <span>Airtel Money</span>
        </li>
      )}
      {(!method || method === "Visa") && (
        <li className="payment-method">
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
          <span>Visa</span>
        </li>
      )}
      {(!method || method === "Mastercard") && (
        <li className="payment-method">
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
          <span>Mastercard</span>
        </li>
      )}
    </ul>
  )
}
