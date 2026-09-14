import Link from '@/components/Link'
import FadeIn from '@/components/FadeIn'
import Accordion from '@/components/Accordion'
import Placeholder from '@/components/Placeholder'
import { SESSIONS, PARTNER_SESSIONS, OFF_PEAK } from '@/data/sessions'
import { CHAIR_FAQS } from '@/data/site'

export const metadata = {
  title: 'The Chairs & Programmes',
  description:
    'Three automated programmes — fifteen, thirty or sixty minutes — in a private suite in Kigali. Prices, what each one does, and what to expect.',
}

export default function SessionsPage() {
  return (
    <main className="sessions-page" id="main-content">
      <div className="page-intro">
        <FadeIn>
          <p className="label">The chairs</p>
          <h1 className="sessions-page__title">
            The machine works.
            <br />
            You rest.
          </h1>
          <p className="sessions-page__sub">
            Three programmes, one chair, one private room. The difference between
            them is how long you have and how much of you gets covered.
          </p>
        </FadeIn>
      </div>

      {/* ── OFF PEAK NOTICE ── */}
      <FadeIn>
        <div className="offpeak">
          <div className="offpeak__inner">
            <span className="offpeak__tag">{OFF_PEAK.label}</span>
            <p className="offpeak__text">
              <strong>{OFF_PEAK.window}</strong> — {OFF_PEAK.saving.toLowerCase()}.
              {' '}{OFF_PEAK.note}
            </p>
          </div>
        </div>
      </FadeIn>

      {/* ── SESSION DETAIL ── */}
      {SESSIONS.map((s, i) => (
        <FadeIn key={s.id}>
          <section
            className={`session${i % 2 === 1 ? ' session--reverse' : ''}`}
            aria-labelledby={`s-${s.id}`}
          >
            <div className="session__media">
              <Placeholder
                shot={`${s.name} — the chair mid-programme, ${s.durationMinutes === 15 ? 'framed on the head and shoulders' : s.durationMinutes === 30 ? 'full chair, reclined' : 'wide, the whole room with the chair fully back'}.`}
              />
            </div>

            <div className="session__body">
              <p className="label">{s.duration}</p>
              <h2 className="session__name" id={`s-${s.id}`}>{s.name}</h2>
              <p className="session__tagline">{s.tagline}</p>

              <div className="session__prices">
                <div className="session__price-main">
                  <span className="session__amount">{s.price}</span>
                  <span className="session__cap">{s.capacity}</span>
                </div>
                <div className="session__price-off">
                  <span className="session__amount-off">{s.offPeakPrice}</span>
                  <span className="session__cap">in quiet hours</span>
                </div>
              </div>

              <p className="session__desc">{s.desc}</p>
              <p className="session__suits"><strong>Good for:</strong> {s.suits}</p>

              <ul className="session__includes">
                {s.includes.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <Link className="btn btn--solid" href={`/book?session=${s.id}`}>
                Book {s.name.toLowerCase()}
              </Link>
            </div>
          </section>
        </FadeIn>
      ))}

      {/* ── PARTNER ── */}
      <FadeIn>
        <section className="partner" id="partner" aria-label="Two suites">
          <div className="partner__head">
            <p className="label">Two suites</p>
            <h2 className="partner__title">Come with someone.</h2>
            <p className="partner__intro">
              Two private rooms side by side, booked for the same slot. You each
              set your own programme behind your own door, then meet in the lounge
              afterwards.
            </p>
          </div>
          <div className="partner__grid">
            {PARTNER_SESSIONS.map(p => (
              <div key={p.id} className="partner__card">
                <h3 className="partner__name">{p.name}</h3>
                <span className="partner__price">{p.price}</span>
                <span className="partner__cap">{p.capacity}</span>
                <p className="partner__desc">{p.desc}</p>
                <Link className="tlink" href={`/book?session=${p.id}`}>
                  Book this →
                </Link>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── FAQ ── */}
      <FadeIn>
        <section className="sessions-faq" aria-label="Questions about the chairs">
          <p className="label" style={{ marginBottom: '40px' }}>
            Before your first session
          </p>
          <Accordion items={CHAIR_FAQS} />
        </section>
      </FadeIn>

      <section className="band" aria-label="Book">
        <p>Not sure which one? Thirty minutes is where most people start.</p>
        <Link className="btn btn--outline-light" href="/book?session=half">
          Book the half hour
        </Link>
      </section>
    </main>
  )
}
