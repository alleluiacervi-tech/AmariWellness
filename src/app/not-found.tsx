import Bloom from "@/components/Bloom"
import Link from "@/components/Link"

export const metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <main id="main-content" className="wrap lost">
      <div className="lost__inner enter">
        <span className="lost__mark" aria-hidden="true">
          <Bloom />
        </span>
        <h1 className="h1">This page has stepped out.</h1>
        <p className="lead">
          Nothing is at this address. The link may be old, or we moved the
          page. The chairs are still where you left them.
        </p>
        <div className="cluster justify-center">
          <Link className="btn" href="/">
            Go to the homepage
          </Link>
          <Link className="tlink" href="/book">
            Book a session
          </Link>
        </div>
      </div>
    </main>
  )
}
