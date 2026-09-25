import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { can } from "@/server/auth/roles"
import { getMaintenanceBlocksForAdmin, getSuitesForAdmin } from "@/server/db/content"
import SuiteCard from "./SuiteCard"
import AddSuiteForm from "./AddSuiteForm"

export const metadata = {
  title: "Suites & maintenance — Amari workspace",
  robots: { index: false, follow: false },
}

/**
 * Gated at `suites.maintenance`, the lower of the two capabilities that
 * touch this page — Front desk has it, so they can see the floor and
 * take a chair out of service, but the suite name/status/note form
 * below only renders for `suites.edit` (Owner/Manager). See CLAUDE.md §3.
 */
export default async function StaffSuitesPage() {
  const staff = await requireStaffPage("suites.maintenance")
  const canEdit = can(staff.role, "suites.edit")
  const [suites, blocks] = await Promise.all([getSuitesForAdmin(), getMaintenanceBlocksForAdmin()])

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 720 }}>
        <div className="stack--tight">
          <Link className="tlink" href="/staff">
            ← Workspace
          </Link>
          <p className="label">Suites &amp; maintenance</p>
          <h1 className="h2">The floor, suite by suite.</h1>
        </div>

        <div className="stack">
          {suites.map((suite) => (
            <SuiteCard
              key={suite.id}
              suite={suite}
              blocks={blocks.filter((b) => b.suiteId === suite.id)}
              canEdit={canEdit}
            />
          ))}
        </div>

        {canEdit && (
          <section className="form-card">
            <h2 className="h3">Add a suite</h2>
            <AddSuiteForm />
          </section>
        )}
      </div>
    </main>
  )
}
