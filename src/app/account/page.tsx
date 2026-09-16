import Link from "@/components/Link"
import { SITE_CONFIG } from "@/data/site"

/* Returning-guest surface. Balances, bookings and visits are mock data
   until the booking system is wired up — the layout is the deliverable. */

export const metadata = {
  title: "My bookings",
  description: "Your session balance, your next booking, and your locker.",
}

const VISITS = [
  { when: "09 SEP · 18:30", what: "The Half Hour", note: "Suite 2 · level 3" },
  { when: "02 SEP · 12:15", what: "The Quick Reset", note: "Suite 1 · quiet hours" },
  { when: "26 AUG · 19:00", what: "The Half Hour", note: "Suite 4 · level 4" },
  { when: "19 AUG · 11:00", what: "The Full Session", note: "Suite 2 · quiet hours" },
]

export default function AccountPage() {
  return (
    <main id="main-content" className="surface-deep" data-dark-top style={{ minHeight: "calc(100vh - var(--nav-h))" }}>
      <div className="wrap sec--tight stack" style={{ gap: "clamp(32px, 4vw, 56px)" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--s-rule)", paddingBottom: 24 }}>
          <div>
            <p className="label">Signed in · {SITE_CONFIG.contact.phone}</p>
            <h1 className="h1" style={{ marginTop: 14 }}>Welcome back.</h1>
          </div>
          <Link className="btn" href="/book">Book a chair</Link>
        </div>

        <div className="rule-grid" style={{ border: "1px solid var(--s-rule)" }}>
          <div className="stack--tight" style={{ background: "var(--s-raised)" }}>
            <span className="label">Sessions left</span>
            <span className="data--lg" style={{ fontSize: 42, lineHeight: 1 }}>06</span>
            <span className="meta">Ten Half Hours · expires 12 Nov 2026</span>
            <div style={{ height: 4, background: "var(--s-rule-2)", marginTop: 6 }}>
              <div style={{ width: "60%", height: 4, background: "var(--gold)" }} />
            </div>
          </div>
          <div className="stack--tight" style={{ background: "var(--s-raised)" }}>
            <span className="label">Next session</span>
            <span className="data--lg" style={{ fontSize: 30, color: "var(--s-ink)" }}>THU 18:30</span>
            <span className="meta">The Half Hour · Suite 2</span>
            <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
              <button className="tlink">Move</button>
              <button className="tlink" style={{ borderBottomColor: "var(--alarm)" }}>Cancel</button>
            </div>
          </div>
          <div className="stack--tight" style={{ background: "var(--s-raised)" }}>
            <span className="label">Your locker</span>
            <span className="data--lg" style={{ fontSize: 30, color: "var(--s-ink)" }}>No. 04</span>
            <span className="meta">Held for your visits while the pack runs.</span>
          </div>
        </div>

        <div className="rail">
          <div className="rail__body" style={{ flex: "1 1 420px" }}>
            <p className="label" style={{ marginBottom: 18 }}>Recent visits</p>
            {VISITS.map((v) => (
              <div key={v.when} style={{ borderTop: "1px solid var(--s-rule)", padding: "16px 0", display: "flex", flexWrap: "wrap", gap: "10px 20px", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="data" style={{ color: "var(--s-meta)" }}>{v.when}</span>
                <span className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 20 }}>{v.what}</span>
                <span className="data" style={{ color: "var(--s-body)" }}>{v.note}</span>
              </div>
            ))}
          </div>
          <div className="stack" style={{ flex: "1 1 300px", border: "1px solid var(--s-rule)", padding: 26, gap: 14, alignSelf: "flex-start" }}>
            <p className="label">Top up</p>
            <h2 className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 27 }}>Four sessions left of ten.</h2>
            <p className="meta">Buy the next pack before this one expires and the remaining balance rolls over once.</p>
            <Link className="btn btn--outline" href="/packs" style={{ alignSelf: "flex-start" }}>See packs</Link>
          </div>
        </div>
      </div>
    </main>
  )
}
