import CtaBand from "@/components/CtaBand"
import Dial from "@/components/Dial"
import Faq from "@/components/Faq"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import { Check } from "@/components/icons"
import { INCLUDED, OFF_PEAK } from "@/data/sessions"
import { getFaqs, getPackProducts, getSessionTypes } from "@/server/db/content"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Sessions & prices",
  description:
    "Compare 15, 30 and 60 minute private massage sessions at Amari in Kigali, with quiet-hours prices on weekday afternoons.",
  path: "/sessions",
})

export default async function SessionsPage() {
  const [sessions, packs, sessionFaqs] = await Promise.all([
    getSessionTypes(),
    getPackProducts(),
    getFaqs("sessions"),
  ])
  const questions = [
    ...sessionFaqs,
    { q: "When are quiet-hours prices available?", a: `Quiet-hours rates apply ${OFF_PEAK.window}. ${OFF_PEAK.note}` },
  ]
  const halfHourPack = packs.find((p) => p.featured) ?? packs[0]

  return (
    <main id="main-content">
      <PageHeader
        title="Fifteen minutes, or a whole hour."
        lead="The same private suite and the same chair, with a little more time to make it yours. Quiet-hours prices apply on weekdays before 16:00."
      >
        <nav className="jump-links" aria-label="Jump to a session">
          {sessions.map((s) => (
            <a className="chip" href={`#${s.id}`} key={s.id}>
              {s.durationMinutes} min
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="wrap">
        <div className="inclusions">
          <span className="label">Every session includes</span>
          <ul>
            {INCLUDED.map((item) => (
              <li key={item}>
                <Check />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {sessions.map((s) => (
          <article
            className="programme"
            id={s.id}
            key={s.id}
            aria-labelledby={`${s.id}-title`}
          >
            <div className="programme__dial">
              <Dial minutes={s.durationMinutes} size="lg" />
            </div>
            <div className="programme__body">
              <h2 className="h2" id={`${s.id}-title`}>
                {s.name}
              </h2>
              <p className="programme__intro">{s.intro}</p>
              <p className="body">{s.about}</p>
              <ul className="check-list">
                {s.highlights.map((h) => (
                  <li key={h}>
                    <Check />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <aside className="programme__aside" aria-label={`${s.name} prices`}>
              <dl className="programme__prices">
                <div>
                  <dt>Standard</dt>
                  <dd>{s.price}</dd>
                </div>
                <div>
                  <dt>Quiet hours</dt>
                  <dd>{s.offPeakPrice}</dd>
                </div>
              </dl>
              <p className="meta">Per person, in your own suite.</p>
              <Link className="btn btn--block" href={`/book?session=${s.id}`}>
                Book {s.durationMinutes} minutes
              </Link>
            </aside>
          </article>
        ))}
      </div>

      <CtaBand
        name="Session packs"
        title="Coming back? Pay less per session."
        body={`Prepaid packs bring a half hour down to ${halfHourPack?.perSession ?? "less"}. Shareable, no subscription, no card on file.`}
        href="/packs"
        cta="See session packs"
        secondary={
          <Link className="tlink" href="/packs#voucher">
            Give one as a gift
          </Link>
        }
      />

      <div className="wrap sec">
        <Faq name="sessions-faq" items={questions} title="Before you book.">
          <p className="small">
            If you have a medical condition, talk to your doctor first, then to
            us. We would rather turn a booking away than give you a session you
            should not have.
          </p>
          <Link className="tlink" href="/contact">
            Ask the desk
          </Link>
        </Faq>
      </div>
    </main>
  )
}
