import { notFound } from "next/navigation"
import QRCode from "qrcode"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import { pageMetadata } from "@/lib/metadata"
import { bookingReference } from "@/lib/booking"
import { formatKigaliDay, formatKigaliTime, formatRwf } from "@/lib/kigaliTime"
import { requireClientPage } from "@/server/client-auth/dal"
import { getClientBooking } from "@/server/availability/bookingsForClient"
import { getLocation } from "@/server/db/content"
import { changePolicy } from "@/server/booking/clientChanges"
import { encodeQrPayload } from "@/server/qr"
import ManageBooking from "./ManageBooking"

export const metadata = {
  ...pageMetadata({ title: "Your booking", description: "Your booking, its QR code and receipt.", path: "/account" }),
  robots: { index: false, follow: false },
}

const STATUS: Record<string, string> = {
  held: "Awaiting payment",
  confirmed: "Confirmed",
  checked_in: "Checked in",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "Missed",
}

const METHOD: Record<string, string> = { momo: "MTN MoMo", airtel: "Airtel Money", card: "Card", other: "At reception" }

/**
 * One booking from the client's side (Phase 1.5): the QR to show at the
 * door while it's upcoming, a receipt built from the ledger, and — within
 * the cancellation policy — moving or cancelling it. `getClientBooking`
 * filters by the signed-in client in the query itself, so another
 * client's booking id is simply not found.
 */
export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const client = await requireClientPage()
  const { id } = await params
  const booking = await getClientBooking(client.id, id)
  if (!booking) notFound()

  const location = await getLocation()
  const now = new Date()
  const policy = changePolicy(booking, location.cancellationWindowHours, now)
  const reference = bookingReference(booking.id)
  const upcoming = booking.status === "confirmed" && booking.startAt > now
  const qr = upcoming && booking.qrToken ? await QRCode.toDataURL(encodeQrPayload(booking.id, booking.qrToken), { margin: 1, width: 240 }) : null
  const heldRwf = booking.money.paidRwf - booking.money.discountRwf - booking.money.refundedRwf

  return (
    <main id="main-content">
      <PageHeader
        title={booking.sessionName}
        lead={
          <>
            {formatKigaliDay(booking.startAt)} at <span className="font-mono">{formatKigaliTime(booking.startAt)}</span>
          </>
        }
      >
        <Link className="btn btn--outline" href="/account">
          All bookings
        </Link>
      </PageHeader>

      <div className="wrap sec--tight">
        {/* Left-aligned under the page title, but no wider than a receipt should read. */}
        <div className="stack max-w-[720px]">
          {qr && (
            <section className="ticket" aria-labelledby="qr-title">
              <div className="ticket__top">
                <h2 className="h3" id="qr-title">
                  Show this at reception
                </h2>
                <span className="ticket__ref">{reference}</span>
                {/* eslint-disable-next-line @next/next/no-img-element -- a locally generated data: URI */}
                <img src={qr} alt="Check-in QR code" width={240} height={240} />
                <p className="meta">It works once, on the day of your session.</p>
              </div>
            </section>
          )}

          <section className="stack--tight" aria-labelledby="receipt-title">
            <h2 className="h3" id="receipt-title">
              Receipt
            </h2>
            <dl className="stack--tight m-0">
              <div className="summary__row">
                <dt>Reference</dt>
                <dd className="font-mono">{reference}</dd>
              </div>
              <div className="summary__row">
                <dt>Session</dt>
                <dd>
                  {booking.sessionName}, <span className="font-mono">{booking.durationMinutes} min</span>
                </dd>
              </div>
              <div className="summary__row">
                <dt>Suite</dt>
                <dd>{booking.suiteName}</dd>
              </div>
              <div className="summary__row">
                <dt>Status</dt>
                <dd>{STATUS[booking.status]}</dd>
              </div>
              {booking.payment && (
                <>
                  <div className="summary__row">
                    <dt>Paid</dt>
                    <dd>
                      <span className="font-mono">{formatRwf(booking.money.paidRwf)}</span> by {METHOD[booking.payment.method]}
                    </dd>
                  </div>
                  <div className="summary__row">
                    <dt>Paid on</dt>
                    <dd>
                      {formatKigaliDay(booking.payment.paidAt)}, <span className="font-mono">{formatKigaliTime(booking.payment.paidAt)}</span>
                    </dd>
                  </div>
                  <div className="summary__row">
                    <dt>Payment reference</dt>
                    <dd className="font-mono">{booking.payment.providerReference}</dd>
                  </div>
                </>
              )}
              {booking.money.discountRwf > 0 && (
                <div className="summary__row">
                  <dt>Discount</dt>
                  <dd className="font-mono">{formatRwf(booking.money.discountRwf)}</dd>
                </div>
              )}
              {booking.money.refundedRwf > 0 && (
                <div className="summary__row">
                  <dt>Refunded</dt>
                  <dd className="font-mono">{formatRwf(booking.money.refundedRwf)}</dd>
                </div>
              )}
            </dl>
            <p className="meta">Prices include VAT. Your tax receipt (EBM) is issued at reception.</p>
          </section>

          {(policy.kind !== "closed" || booking.status === "cancelled") && (
            <section className="stack--tight" aria-labelledby="change-title">
              <h2 className="h3" id="change-title">
                {booking.status === "cancelled" ? "Cancelled" : "Change or cancel"}
              </h2>
              {booking.status === "cancelled" ? (
                <p className="body">
                  {booking.money.refundedRwf > 0
                    ? `This booking was cancelled, and ${formatRwf(booking.money.refundedRwf)} was refunded to the account you paid from.`
                    : "This booking was cancelled."}
                </p>
              ) : (
                <ManageBooking
                  bookingId={booking.id}
                  sessionTypeId={booking.sessionTypeId}
                  policy={
                    "freeUntil" in policy
                      ? {
                          kind: policy.kind,
                          freeUntilLabel: `${formatKigaliDay(policy.freeUntil)} at ${formatKigaliTime(policy.freeUntil)}`,
                        }
                      : policy
                  }
                  refundableRwf={Math.max(0, heldRwf)}
                  cancellationWindowHours={location.cancellationWindowHours}
                  whatsapp={location.whatsapp ?? ""}
                />
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
