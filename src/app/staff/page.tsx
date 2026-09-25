import { desc, eq } from "drizzle-orm"
import { requireStaffPage } from "@/server/auth/dal"
import { logoutAction } from "@/server/auth/actions"
import { db } from "@/server/db/client"
import { activityLog } from "@/server/db/schema"
import { ROLE_LABELS } from "@/server/auth/roles"

export const metadata = {
  title: "Amari workspace",
  robots: { index: false, follow: false },
}

/**
 * A minimal, real, database-backed shell — proof that the auth chain
 * works end to end (session, roles, activity log), not the admin
 * interface itself. `src/components/admin/AdminDashboard.tsx` is the
 * polished design preview P1.3 wires up to real data next; this page
 * is deliberately plain until then. See CLAUDE.md Phase 1.3.
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

        <p className="body">
          This is a placeholder. Phase 1.3 wires real bookings, prices, hours and content into an admin interface
          here — see <span className="font-mono">CLAUDE.md</span>.
        </p>

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
