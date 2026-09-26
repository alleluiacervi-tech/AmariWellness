import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { can } from "@/server/auth/roles"
import { db } from "@/server/db/client"
import { getLocation } from "@/server/db/content"
import { getFloor } from "@/server/checkin/floor"
import { formatKigaliDay } from "@/lib/kigaliTime"
import CheckInPanel from "./CheckInPanel"
import FloorSuiteRow from "./FloorSuiteRow"
import AutoRefresh from "./AutoRefresh"

export const metadata = {
  title: "Check-in and floor — Amari workspace",
  robots: { index: false, follow: false },
}

/**
 * Reception's screen (Phase 1.5): scan a guest's QR at the top, see
 * every suite's state underneath. `bookings.checkIn` (Owner, Manager,
 * Front desk) opens the page; moving a suite between cleaning and ready
 * is `suites.maintenance`, the same floor capability the suites page
 * uses. Each Server Action re-checks its own capability regardless.
 */
export default async function FloorPage() {
  const staff = await requireStaffPage("bookings.checkIn")
  const location = await getLocation()
  const floor = await getFloor(db, location.id)

  return (
    <main id="main-content" className="surface-paper">
      <AutoRefresh seconds={60} />
      <div className="wrap sec--tight stack" style={{ maxWidth: 820 }}>
        <div className="stack--tight">
          <Link className="tlink" href="/staff">
            ← Workspace
          </Link>
          <p className="label">Check-in and floor</p>
          <h1 className="h2">{formatKigaliDay(new Date())}</h1>
        </div>

        <section className="form-card">
          <h2 className="h3">Check a guest in</h2>
          <CheckInPanel />
        </section>

        <section className="stack--tight">
          <h2 className="h3">Suites</h2>
          {floor.length === 0 ? (
            <p className="meta">No active suites. Add one on the suites page.</p>
          ) : (
            <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {floor.map((suite) => (
                <FloorSuiteRow
                  key={suite.id}
                  suite={suite}
                  canFinish={can(staff.role, "bookings.checkIn")}
                  canSetStatus={can(staff.role, "suites.maintenance")}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
