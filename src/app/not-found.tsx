import Link from "@/components/Link"

export const metadata = {
  title: "Page not found",
}

export default function NotFound() {
  return (
    <main className="surface-deep" data-dark-top id="main-content">
      <div
        className="wrap sec stack"
        style={{ minHeight: "58vh", justifyContent: "center", maxWidth: "62ch" }}
      >
        <p className="label">Error 404</p>
        <h1 className="display" style={{ fontSize: "var(--t-h1)" }}>
          That page doesn&apos;t exist.
        </h1>
        <p className="lead">
          Either the link was wrong or we moved something. Nothing you did. The
          chairs are still where you left them.
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Link className="btn" href="/">
            Back to the homepage
          </Link>
          <Link className="tlink" href="/book">
            Book a chair &rarr;
          </Link>
        </div>
      </div>
    </main>
  )
}
