import Link from "@/components/Link"

export default function NotFound() {
  return (
    <main className="not-found surface-deep" data-dark-top id="main-content">
      <p className="not-found__code">Error 404</p>
      <h1 className="not-found__title">That page doesn&apos;t exist.</h1>
      <p className="not-found__body">
        Either the link was wrong or we moved something. Nothing you did. The
        chairs are still where you left them.
      </p>
      <div className="not-found__actions">
        <Link className="btn btn--solid" href="/">
          Back to the homepage
        </Link>
        <Link className="tlink" href="/book">
          Book a chair
          <span className="tlink__arrow" aria-hidden="true">
            &rarr;
          </span>
        </Link>
      </div>
    </main>
  )
}
