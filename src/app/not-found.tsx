import Bloom from "@/components/Bloom"
import Link from "@/components/Link"
import { Arrow } from "@/components/icons"

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
        <p className="label">Error 404</p>
        <h1 className="h1">
          This page has <em>stepped out.</em>
        </h1>
        <p className="lead">
          Either the link was wrong or we moved something. Nothing you did —
          the chairs are still where you left them.
        </p>
        <div className="cluster justify-center">
          <Link className="btn" href="/">
            Back to the homepage <Arrow />
          </Link>
          <Link className="tlink" href="/book">
            Book a session <Bloom />
          </Link>
        </div>
      </div>
    </main>
  )
}
