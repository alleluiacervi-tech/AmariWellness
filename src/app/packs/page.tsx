import Link from "@/components/Link"
import Faq from "@/components/Faq"
import { PACKS, GIFT_VOUCHER, CORPORATE } from "@/data/packs"
import { PACK_FAQS } from "@/data/site"

export const metadata = {
  title: "Session packs, vouchers & companies",
  description:
    "Buy sessions up front at a lower price per session. No monthly charge, no card on file, no subscription to cancel.",
}

export default function PacksPage() {
  return (
    <main id="main-content">
      <section className="surface-deep" data-dark-top>
        <div className="wrap" style={{ paddingBlock: "clamp(64px, 9vw, 124px) clamp(48px, 7vw, 80px)" }}>
          <p className="label">Packs · Vouchers · Companies</p>
          <h1 className="h1" style={{ marginTop: 20, maxWidth: "22ch" }}>
            Pay once. Come back whenever you like.
          </h1>
          <p className="lead" style={{ marginTop: 24, maxWidth: "58ch" }}>
            No monthly charge, no card on file, no subscription to cancel. Your balance sits
            against your phone number and is deducted when you book.
          </p>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap sec--tight rule-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {PACKS.map((p) => (
            <article
              key={p.id}
              className={p.featured ? "surface-dark stack" : "stack"}
              style={{ gap: 14, padding: "clamp(28px, 3vw, 40px) clamp(24px, 3vw, 34px)" }}
            >
              <span className="label">{p.featured ? "Most people choose this" : p.validity}</span>
              <h2 className="h2" style={{ fontSize: 32 }}>{p.name}</h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span className="data--lg">{p.price}</span>
                <span className="data" style={{ color: "var(--s-meta)" }}>{p.perSession}</span>
              </div>
              <p className="data" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--s-meta)" }}>
                {p.sessions} · {p.validity} · {p.saving}
              </p>
              <p className="meta" style={{ fontSize: 16 }}>{p.description}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: "18px 0 0", borderTop: "1px solid var(--s-rule)", display: "flex", flexDirection: "column", gap: 8 }}>
                {p.includes.map((i) => (
                  <li key={i} style={{ fontSize: 15, lineHeight: 1.5 }}>{i}</li>
                ))}
              </ul>
              <Link className={p.featured ? "btn" : "btn btn--outline"} href="/book" style={{ marginTop: "auto", alignSelf: "flex-start" }}>
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-dim">
        <div className="wrap sec--tight grid-2">
          <div className="stack" id="voucher">
            <p className="label">{GIFT_VOUCHER.name}</p>
            <h2 className="h2" style={{ fontSize: "clamp(28px, 3.6vw, 42px)" }}>
              For someone who will not book this for themselves.
            </h2>
            <p className="meta" style={{ fontSize: 16, maxWidth: "52ch" }}>{GIFT_VOUCHER.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
              {GIFT_VOUCHER.amounts.map((a) => (
                <span key={a} className="badge" style={{ padding: "14px 20px", fontSize: 14 }}>{a}</span>
              ))}
            </div>
            <Link className="btn" href="/contact?subject=voucher" style={{ alignSelf: "flex-start", marginTop: 8 }}>
              {GIFT_VOUCHER.cta}
            </Link>
          </div>

          <div className="stack" id="corporate" style={{ borderLeft: "1px solid var(--s-rule)", paddingLeft: "clamp(0px, 3vw, 48px)" }}>
            <p className="label">{CORPORATE.name}</p>
            <h2 className="h2" style={{ fontSize: "clamp(28px, 3.6vw, 42px)" }}>
              A staff benefit people actually use.
            </h2>
            <p className="meta" style={{ fontSize: 16, maxWidth: "52ch" }}>{CORPORATE.description}</p>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {CORPORATE.points.map((c) => (
                <li key={c} style={{ borderTop: "1px solid var(--s-rule)", paddingTop: 10, fontSize: 15, lineHeight: 1.55 }}>{c}</li>
              ))}
            </ul>
            <Link className="btn btn--outline" href="/contact?subject=corporate" style={{ alignSelf: "flex-start", marginTop: 8 }}>
              {CORPORATE.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap sec--tight">
          <Faq items={PACK_FAQS} label="How packs work" />
        </div>
      </section>
    </main>
  )
}
