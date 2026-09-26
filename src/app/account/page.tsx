import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import { pageMetadata } from "@/lib/metadata"
import { requireClientPage } from "@/server/client-auth/dal"
import { clientLogoutAction } from "@/server/client-auth/actions"
import { getBookingsForClient, type ClientBookingRow } from "@/server/availability/bookingsForClient"
import { checkInWindow } from "@/server/jobs/policy"
import { formatISODate, formatKigaliTime, kigaliDateISO } from "@/lib/kigaliTime"

export const metadata = {
  ...pageMetadata({
    title: "My bookings",
    description: "Your upcoming and past sessions.",
    path: "/account",
  }),
  robots: { index: false, follow: false },
}

function formatVisit(b: ClientBookingRow) {
  return { day: formatISODate(kigaliDateISO(b.startAt), { day: "numeric", month: "short" }), time: formatKigaliTime(b.startAt) }
}

const STATUS_NOTE: Record<ClientBookingRow["status"], string> = {
  held: "Awaiting payment",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Missed",
}

/** Phase 1.4b/1.5 — see CLAUDE.md. Real bookings for the signed-in client; each links to its own page (`/account/bookings/[id]`) with the QR, the receipt, and moving or cancelling within the policy. Packs and vouchers aren't built yet (Phase 2), so that panel from the earlier design preview is dropped rather than shown with fake numbers. */
export default async function AccountPage() {
  const client = await requireClientPage()
  const allBookings = await getBookingsForClient(client.id)
  const now = new Date()
  // Upcoming until the desk would stop accepting its QR, so a client running late still finds it at the top.
  const isUpcoming = (b: ClientBookingRow) => b.status === "confirmed" && now < checkInWindow(b.startAt).closesAt
  const upcoming = allBookings.filter(isUpcoming)
  const past = allBookings.filter((b) => !isUpcoming(b))

  return (
    <main id="main-content">
      <PageHeader
        title={`Welcome back${client.name && client.name !== "Guest" ? `, ${client.name.split(" ")[0]}` : ""}.`}
        lead={
          upcoming.length > 0
            ? `${upcoming.length} upcoming ${upcoming.length === 1 ? "session" : "sessions"}.`
            : "No upcoming sessions yet."
        }
      >
        <Link className="btn" href="/book">
          Book a session
        </Link>
        <form action={clientLogoutAction}>
          <button className="btn btn--outline" type="submit">
            Sign out
          </button>
        </form>
      </PageHeader>

      <section className="wrap sec--tight stack" aria-labelledby="upcoming-title">
        <h2 className="h3" id="upcoming-title">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="meta">Nothing booked yet.</p>
        ) : (
          <ol className="visits">
            {upcoming.map((b) => {
              const { day, time } = formatVisit(b)
              return (
                <li className="visit" key={b.id}>
                  <span className="visit__when">
                    {day} <span className="font-mono">{time}</span>
                  </span>
                  <span className="h4">{b.sessionName}</span>
                  <Link className="tlink" href={`/account/bookings/${b.id}`}>
                    QR code and changes
                  </Link>
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <section className="wrap sec--tight stack" aria-labelledby="past-title">
        <h2 className="h3" id="past-title">
          Past visits
        </h2>
        {past.length === 0 ? (
          <p className="meta">No visits yet.</p>
        ) : (
          <ol className="visits">
            {past.map((b) => {
              const { day, time } = formatVisit(b)
              return (
                <li className="visit" key={b.id}>
                  <span className="visit__when">
                    {day} <span className="font-mono">{time}</span>
                  </span>
                  <span className="h4">{b.sessionName}</span>
                  <span className="visit__note">
                    {STATUS_NOTE[b.status]},{" "}
                    <Link className="tlink" href={`/account/bookings/${b.id}`}>
                      receipt
                    </Link>
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </section>
    </main>
  )
}
