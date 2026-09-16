import Link from "@/components/Link"
import { ARTICLES } from "@/data/journal"

export const metadata = {
  title: "The journal",
  description: "Notes on stopping — rest, silence, and the small act of being unreachable for an hour.",
}

export default function JournalPage() {
  return (
    <main id="main-content">
      <section className="surface-dim">
        <div className="wrap" style={{ paddingBlock: "clamp(56px, 8vw, 104px) clamp(40px, 5vw, 64px)" }}>
          <p className="label">The journal · {ARTICLES.length} pieces</p>
          <h1 className="display" style={{ marginTop: 18, maxWidth: "22ch" }}>Notes on stopping.</h1>
        </div>
      </section>

      <section className="surface-paper">
        <div className="wrap" style={{ paddingBlock: "clamp(40px, 6vw, 80px) clamp(64px, 9vw, 112px)", display: "flex", flexDirection: "column" }}>
          {ARTICLES.map((a) => (
            <Link key={a.slug} className="journal__row" href={`/journal/${a.slug}`}>
              <span className="stack--tight">
                <span className="data" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                  {a.date} · {a.readTime}
                </span>
                <span className="h2" style={{ fontSize: "clamp(28px, 3.2vw, 40px)" }}>{a.title}</span>
              </span>
              <span className="meta" style={{ fontSize: 16, maxWidth: "52ch" }}>{a.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
