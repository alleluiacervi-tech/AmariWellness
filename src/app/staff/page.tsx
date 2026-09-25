import { desc, eq } from "drizzle-orm"
import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { logoutAction } from "@/server/auth/actions"
import { db } from "@/server/db/client"
import { activityLog } from "@/server/db/schema"
import { can, ROLE_LABELS } from "@/server/auth/roles"

const SECTIONS = [
  { href: "/staff/bookings", label: "Bookings", capability: "bookings.view" as const },
  { href: "/staff/sessions", label: "Sessions & pricing", capability: "prices.edit" as const },
  { href: "/staff/location", label: "Location & hours", capability: "hours.edit" as const },
  { href: "/staff/suites", label: "Suites & maintenance", capability: "suites.maintenance" as const },
  { href: "/staff/content", label: "Website text & FAQs", capability: "content.edit" as const },
]

export const metadata = {
  title: "Amari workspace",
  robots: { index: false, follow: false },
}

/**
 * The real, database-backed staff home — still plainly styled rather
 * than the polished `src/components/admin/AdminDashboard.tsx` preview,
 * but no longer just a proof of the auth chain: "Manage" links to the
 * real admin pages Phase 1.3 part 2 is building out one at a time, each
 * gated by the same `can()` check its own page and Server Actions
 * enforce again — this list is a convenience, not the access control.
 * See CLAUDE.md Phase 1.3.
 */
export default async function StaffHomePage() {
  const staff = await requireStaffPage()

  const recentActivity = await db
    .select({ id: activityLog.id, action: activityLog.action, createdAt: activityLog.createdAt })
    .from(activityLog)
    .where(eq(activityLog.staffUserId, staff.id))
    .orderBy(desc(activityLog.createdAt))
    .limit(5)

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 640 }}>
        <div className="cluster justify-between">
          <div className="stack--tight">
            <p className="label">Amari workspace</p>
            <h1 className="h2">Welcome, {staff.name.split(" ")[0]}.</h1>
            <p className="small">
              Signed in as {staff.email} · <span className="tag">{ROLE_LABELS[staff.role]}</span>
            </p>
          </div>
          <form action={logoutAction}>
            <button className="btn btn--outline" type="submit">
              Sign out
            </button>
          </form>
        </div>

        <div className="stack--tight">
          <h2 className="h4">Manage</h2>
          {SECTIONS.filter((s) => can(staff.role, s.capability)).length === 0 ? (
            <p className="meta">Nothing your role can edit yet — check with the owner.</p>
          ) : (
            <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {SECTIONS.filter((s) => can(staff.role, s.capability)).map((s) => (
                <li key={s.href}>
                  <Link className="tlink" href={s.href}>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="meta">
            More of the back office arrives through Phase 1.3 — see <span className="font-mono">CLAUDE.md</span>.
          </p>
        </div>

        <div className="stack--tight">
          <h2 className="h4">Your recent activity</h2>
          {recentActivity.length === 0 ? (
            <p className="meta">Nothing yet — actions you take will show up here.</p>
          ) : (
            <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentActivity.map((entry) => (
                <li key={entry.id} className="meta">
                  <span className="font-mono">{entry.createdAt.toISOString()}</span> — {entry.action}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  )
}
