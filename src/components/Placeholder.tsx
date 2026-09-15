export interface PlaceholderProps {
  /** What needs to be shot here. Doubles as the photography brief. */
  shot: string
  kind?: "photo" | "video"
  /**
   * Backdrop mode hides the brief. Behind hero type the brief has
   * nowhere to sit without colliding with the headline, so the
   * texture carries the frame and the brief stays in the source.
   */
  backdrop?: boolean
  className?: string
}

/**
 * Stands in for photography that does not exist yet. Deliberately not
 * a grey box: it reads as reserved space with a brief attached, so
 * nothing borrowed ships while the real shoot is outstanding.
 */
export default function Placeholder({
  shot,
  kind = "photo",
  backdrop = false,
  className = "",
}: PlaceholderProps) {
  return (
    <div
      className={`ph${backdrop ? " ph--backdrop" : ""} ${className}`}
      role="img"
      aria-label={backdrop ? shot : `Placeholder — ${shot}`}
    >
      <div className="ph__grid" aria-hidden="true" />
      <div className="ph__body">
        <span className="ph__kind">
          {kind === "video" ? "Film" : "Photograph"}
        </span>
        <p className="ph__shot">{shot}</p>
      </div>
      {kind === "video" && !backdrop && (
        <span className="ph__play" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
          >
            <polygon
              points="9,7 18,12 9,17"
              fill="currentColor"
              stroke="none"
            />
            <circle cx="12" cy="12" r="11" />
          </svg>
        </span>
      )}
    </div>
  )
}
