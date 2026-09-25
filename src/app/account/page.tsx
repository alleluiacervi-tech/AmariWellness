import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import { pageMetadata } from "@/lib/metadata"

/* Returning-guest surface. Balances, bookings and visits are mock data
   until the booking system is wired up — the layout is the deliverable. */

export const metadata = {
  ...pageMetadata({
    title: "My bookings",
    description: "Your session balance, your next booking, and your locker.",
    path: "/account",
  }),
  robots: { index: false, follow: true },
}

const PACK = { name: "Ten Half Hours", total: 10, left: 6, expires: "12 Nov 2026" }

const VISITS = [
  { day: "9 Sep", time: "18:30", what: "The Half Hour", note: "Suite 2, intensity 3" },
  { day: "2 Sep", time: "12:15", what: "The Quick Reset", note: "Suite 1, quiet hours" },
  { day: "26 Aug", time: "19:00", what: "The Half Hour", note: "Suite 4, intensity 4" },
  { day: "19 Aug", time: "11:00", what: "The Full Session", note: "Suite 2, quiet hours" },
]

export default function AccountPage() {
  return (
    <main id="main-content">
      <PageHeader
        label={<span className="tag tag--outline">Sample account, for preview</span>}
        title="Welcome back."
        lead="Six sessions left on your pack, and a quiet room waiting for you on Thursday evening."
      >
        <Link className="btn" href="/book">
          Book a session
        </Link>
      </PageHeader>

      <section className="wrap" aria-label="Your balance">
        <div className="stat-grid">
          <div className="stat">
            <span className="label">Sessions left</span>
            <span className="stat__value">
              {String(PACK.left).padStart(2, "0")}
              <small>of {PACK.total}</small>
            </span>
            <div
              className="meter"
              role="meter"
              aria-label="Sessions left"
              aria-valuemin={0}
              aria-valuemax={PACK.total}
              aria-valuenow={PACK.left}
            >
              <span style={{ width: `${(PACK.left / PACK.total) * 100}%` }} />
            </div>
            <span className="meta">
              {PACK.name}, expires {PACK.expires}
            </span>
          </div>
          <div className="stat">
            <span className="label">Next session</span>
            <span className="stat__value">Thu 18:30</span>
            <span className="meta">The Half Hour, suite 2</span>
            <Link className="tlink self-start" href="/book?session=half">
              Change the time
            </Link>
          </div>
          <div className="stat">
            <span className="label">Your locker</span>
            <span className="stat__value">No. 04</span>
            <span className="meta">Held for your visits while the pack runs.</span>
          </div>
        </div>
      </section>

      <section className="wrap sec--tight split split--top" aria-labelledby="visits-title">
        <div className="stack">
          <h2 className="h3" id="visits-title">
            Recent visits
          </h2>
          <ol className="visits">
            {VISITS.map((v) => (
              <li className="visit" key={v.day}>
                <span className="visit__when">
                  {v.day} <span className="font-mono">{v.time}</span>
                </span>
                <span className="h4">{v.what}</span>
                <span className="visit__note">{v.note}</span>
              </li>
            ))}
          </ol>
        </div>
        <aside className="offer" aria-labelledby="topup-title">
          <h2 className="h3" id="topup-title">
            Six sessions left of ten.
          </h2>
          <p className="small">
            Buy your next pack before this one expires and the remaining
            balance rolls over once.
          </p>
          <Link className="btn btn--outline" href="/packs">
            See packs
          </Link>
        </aside>
      </section>
    </main>
  )
}
