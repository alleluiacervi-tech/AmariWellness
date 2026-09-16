import Link from "@/components/Link"
import Faq from "@/components/Faq"
import { SESSIONS, PARTNER_SESSIONS } from "@/data/sessions"
import { CHAIR_FAQS } from "@/data/site"

export const metadata = {
  title: "The chairs & programmes",
  description:
    "Fifteen minutes, thirty, or a full hour. Same chair, same private suite, same lounge afterwards.",
}

export default function SessionsPage() {
  return (
    <main id="main-content">
      <section className="surface-deep" data-dark-top>
        <div className="wrap" style={{ paddingBlock: "clamp(64px, 9vw, 124px) clamp(48px, 7vw, 88px)" }}>
          <p className="label">The chairs · Three programmes</p>
          <h1 className="display" style={{ marginTop: 20, maxWidth: "20ch", fontSize: "var(--t-h1)" }}>
            Fifteen minutes, thirty, or a full hour.
          </h1>
          <p className="lead" style={{ marginTop: 24, maxWidth: "56ch" }}>
            Same chair, same private suite, same lounge afterwards. The only difference is how much
            of you the programme has time to reach.
          </p>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap sec--tight" style={{ display: "flex", flexDirection: "column", gap: 1, background: "var(--s-rule)" }}>
          {SESSIONS.map((s) => (
            <article key={s.id} className="grid-2" style={{ background: "var(--s-ground)", padding: "clamp(28px, 4vw, 48px) 0" }}>
              <div className="stack">
                <span className="data" style={{ letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  {s.duration} · {s.capacity}
                </span>
                <h2 className="h2">{s.name}</h2>
                <p className="quote" style={{ fontSize: 21, color: "var(--sage-text)" }}>{s.tagline}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 8 }}>
                  <span className="data--lg">{s.price}</span>
                  <span className="data" style={{ color: "var(--s-meta)" }}>{s.offPeakPrice} quiet hours</span>
                </div>
                <Link className="btn" href={`/book?session=${s.id}`} style={{ alignSelf: "flex-start" }}>
                  Book {s.duration}
                </Link>
              </div>
              <div className="stack">
                <p className="body">{s.desc}</p>
                <p className="meta" style={{ maxWidth: "56ch" }}><em>Suits:</em> {s.suits}</p>
                <ul style={{ listStyle: "none", margin: 0, padding: "18px 0 0", borderTop: "1px solid var(--s-rule)", display: "flex", flexDirection: "column", gap: 9 }}>
                  {s.includes.map((i) => (
                    <li key={i} style={{ display: "grid", gridTemplateColumns: "18px 1fr", gap: 10, fontSize: 15, lineHeight: 1.5 }}>
                      <span className="data" aria-hidden="true">·</span>
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-dim">
        <div className="wrap sec--tight rail">
          <div className="rail__label"><p className="label">Two suites</p></div>
          <div className="rail__body stack" style={{ gap: 24 }}>
            <h2 className="h2" style={{ fontSize: "clamp(28px, 3.6vw, 42px)" }}>Come together, sit separately.</h2>
            <div className="grid-3">
              {PARTNER_SESSIONS.map((p) => (
                <div key={p.id} className="stack--tight" style={{ borderTop: "1px solid var(--s-rule-2)", paddingTop: 18 }}>
                  <span className="data--lg" style={{ fontSize: 22 }}>{p.price}</span>
                  <h3 className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 24 }}>{p.name}</h3>
                  <p className="meta">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap sec--tight">
          <Faq items={CHAIR_FAQS} label="Before you book" />
        </div>
      </section>
    </main>
  )
}
