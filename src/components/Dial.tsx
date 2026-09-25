/**
 * The machine's clock face: an arc that fills in proportion to the
 * session's length against the longest programme (sixty minutes).
 * Gold because it is a reading of the machine, never decoration.
 */

/* Stroke widths are in viewBox units, tuned per rendered size so the
   track stays a hairline and the arc stays ~2–3px on screen. */
const STROKES = {
  sm: { track: 1, arc: 2.2 },
  md: { track: 0.8, arc: 1.7 },
  lg: { track: 0.4, arc: 1 },
}

export default function Dial({
  minutes,
  size = "md",
  of = 60,
}: {
  minutes: number
  size?: "sm" | "md" | "lg"
  of?: number
}) {
  const sweep = Math.min(minutes, of)
  const stroke = STROKES[size]
  return (
    <span className={size === "md" ? "dial" : `dial dial--${size}`}>
      <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
        <circle
          className="dial__track"
          cx="20"
          cy="20"
          r="18.5"
          fill="none"
          strokeWidth={stroke.track}
        />
        <circle
          className="dial__arc"
          cx="20"
          cy="20"
          r="18.5"
          fill="none"
          strokeWidth={stroke.arc}
          pathLength={of}
          strokeDasharray={`${sweep} ${of}`}
        />
      </svg>
      <span className="dial__value">
        {minutes}
        <span className="sr-only"> minutes</span>
      </span>
    </span>
  )
}
