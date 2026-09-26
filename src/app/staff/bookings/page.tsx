import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { can } from "@/server/auth/roles"
import { getSessionTypes } from "@/server/db/content"
import { getBookingsForDay } from "@/server/availability/bookingsForStaff"
import { kigaliDateISO } from "@/lib/kigaliTime"
import NewWalkInForm from "./NewWalkInForm"
import BookingRow from "./BookingRow"

export const metadata = {
  title: "Bookings — Amari workspace",
  robots: { index: false, follow: false },
}

export default async function StaffBookingsPage() {
  const staff = await requireStaffPage("bookings.view")
  const date = kigaliDateISO(new Date())
  const [sessions, dayBookings] = await Promise.all([getSessionTypes(), getBookingsForDay(date)])

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 820 }}>
        <div className="stack--tight">
          <Link className="tlink" href="/staff">
            ← Workspace
          </Link>
          <p className="label">Bookings</p>
          <h1 className="h2">Today, {date}.</h1>
        </div>

        {can(staff.role, "bookings.create") && (
          <section className="form-card">
            <h2 className="h3">Walk-in booking</h2>
            <NewWalkInForm sessions={sessions} date={date} />
          </section>
        )}

        <section className="stack--tight">
          <h2 className="h3">Today&rsquo;s schedule</h2>
          {dayBookings.length === 0 ? (
            <p className="meta">Nothing booked yet today.</p>
          ) : (
            <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {dayBookings.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  canCancel={can(staff.role, "bookings.cancel")}
                  canRefund={can(staff.role, "payments.refund")}
                  canDiscount={can(staff.role, "discounts.apply")}
                  canCheckIn={can(staff.role, "bookings.checkIn")}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
