import CtaBand from "@/components/CtaBand"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import { Arrow } from "@/components/icons"
import { ARTICLES, isoDate } from "@/data/journal"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "The journal",
  description:
    "Notes on stopping — rest, silence, and the small act of being unreachable for an hour.",
  path: "/journal",
})

export default function JournalPage() {
  return (
    <main id="main-content">
      <PageHeader
        surface="surface-dim"
        label={`The journal · ${ARTICLES.length} pieces`}
        title={
          <>
            Notes on <em>stopping.</em>
          </>
        }
        lead="Short essays on rest, silence, and the small act of being unreachable for an hour. Read one in the lounge, or at home."
      />

      <section className="wrap sec--tight" aria-label="All pieces">
        <ol className="journal-list">
          {ARTICLES.map((a, i) => (
            <li key={a.slug}>
              <Link
                className={i === 0 ? "journal-row journal-row--lead" : "journal-row"}
                href={`/journal/${a.slug}`}
              >
                <div className="journal-row__meta">
                  <time dateTime={isoDate(a.date)}>
                    {a.date}
                  </time>
                  <span>{a.readTime}</span>
                </div>
                <div className="journal-row__copy">
                  <h2 className="h3">{a.title}</h2>
                  <p className={i === 0 ? "lead" : "small"}>{a.description}</p>
                </div>
                <Arrow />
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <CtaBand
        label="Put the phone down"
        title={
          <>
            Read less about it. <em>Try it.</em>
          </>
        }
        body="An hour in a quiet room, with nobody asking anything of you."
      />
    </main>
  )
}
