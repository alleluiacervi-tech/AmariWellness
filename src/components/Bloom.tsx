/** Decorative botanical signature; the adjacent text supplies the link's name. */
export default function Bloom() {
  return (
    <svg
      className="bloom"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 12C4 12 4 3 12 3c8 0 8 9 0 9Zm0 0c0-8 9-8 9 0s-9 8-9 0Zm0 0c8 0 8 9 0 9s-8-9 0-9Zm0 0c0 8-9 8-9 0s9-8 9 0Z"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  )
}
