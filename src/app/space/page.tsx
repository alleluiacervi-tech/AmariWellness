import Figure from "@/components/Figure"
import Faq from "@/components/Faq"
import { SHELF, SPACE_FAQS } from "@/data/site"
import { IMAGES } from "@/data/images"

export const metadata = {
  title: "The space & the shelf",
  description:
    "Four private suites, one quiet reading room, and a shelf that changes every month. No music.",
}

export default function SpacePage() {
  return (
    <main id="main-content">
      <section className="surface-paper page-open">
        <div className="wrap page-open__inner">
          <div className="page-open__copy">
            <p className="label">The space · Kimihurura</p>
            <h1 className="h1" style={{ marginTop: 18, maxWidth: "16ch" }}>
              Four suites, one quiet room, no music.
            </h1>
            <p className="lead" style={{ marginTop: 22 }}>
              One room is yours alone and locks from the inside. The other is shared, silent,
              and has no clock in it.
            </p>
          </div>
          <div className="page-open__media">
            <Figure {...IMAGES.timberRoom} eager sizes="(min-width: 900px) 46vw, 100vw" />
          </div>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap sec grid-2" style={{ alignItems: "start" }}>
          <div className="stack">
            <p className="label">The reading room</p>
            <h2 className="h2">A second room, for after.</h2>
            <p className="body">
              Low light, deep chairs, tea poured without being asked for. No clock on the wall and
              nobody waiting for your seat. Quiet laptop work is fine; calls and video meetings are
              the one thing we protect.
            </p>
            <p className="body">
              Lounge access comes with every session and has no time limit. We also keep a few
              seats for people who only want the quiet — ask at reception.
            </p>
          </div>
          <div className="figure--tall">
            <Figure {...IMAGES.loungeChair} sizes="(min-width: 960px) 50vw, 100vw" />
          </div>
        </div>
      </section>

      <section className="surface-stone">
        <div className="wrap sec rail">
          <div className="rail__label stack" style={{ flex: "1 1 340px" }}>
            <p className="label">The shelf</p>
            <h2 className="h2">Changed each month. Nothing is for sale.</h2>
            <p className="meta" style={{ maxWidth: "46ch" }}>{SHELF.note}</p>
          </div>
          <ul className="rail__body" style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {SHELF.titles.map((b) => (
              <li key={b.title} style={{ borderTop: "1px solid var(--s-rule)", padding: "16px 0", display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "space-between", alignItems: "baseline" }}>
                <span className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 21 }}>{b.title}</span>
                <span className="data" style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--s-meta)" }}>{b.author}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap sec--tight" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {[IMAGES.quietRoom, IMAGES.windowSeat, IMAGES.shelves].map((img) => (
            <div key={img.src} className="figure--tall">
              <Figure {...img} sizes="(min-width: 960px) 33vw, 100vw" />
            </div>
          ))}
        </div>
      </section>

      <section className="surface-dim">
        <div className="wrap sec--tight">
          <Faq items={SPACE_FAQS} label="The room, asked about" />
        </div>
      </section>
    </main>
  )
}
