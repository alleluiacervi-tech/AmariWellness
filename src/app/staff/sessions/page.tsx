import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { getSessionTypes } from "@/server/db/content"
import SessionEditForms from "./SessionEditForms"

export const metadata = {
  title: "Sessions & pricing — Amari workspace",
  robots: { index: false, follow: false },
}

export default async function StaffSessionsPage() {
  await requireStaffPage("prices.edit")
  const sessions = await getSessionTypes()

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 720 }}>
        <div className="stack--tight">
          <Link className="tlink" href="/staff">
            ← Workspace
          </Link>
          <p className="label">Sessions &amp; pricing</p>
          <h1 className="h2">Change what a session is, and what it costs.</h1>
          <p className="small">
            A price change never rewrites a booking already made — it only applies going forward, and is logged
            with a reason.
          </p>
        </div>

        <div className="stack">
          {sessions.map((session) => (
            <SessionEditForms key={session.uuid} session={session} />
          ))}
        </div>
      </div>
    </main>
  )
}
