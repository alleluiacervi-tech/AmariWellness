import Link from "@/components/Link"
import Reveal from "@/components/Reveal"
import Accordion from "@/components/Accordion"
import Figure from "@/components/Figure"
import StickyBook from "@/components/StickyBook"
import { SESSIONS, PARTNER_SESSIONS, OFF_PEAK } from "@/data/sessions"
import { CHAIR_FAQS } from "@/data/site"
import { IMAGES } from "@/data/images"

/* Mood imagery, one per programme — these set tone, they do not depict
   the chairs. Swap for real suite photography when it exists. */
const SESSION_IMAGES = [
  IMAGES.readingLamp,
  IMAGES.windowSeat,
  IMAGES.timberRoom,
]

/* Surfaced rather than buried in the accordion: these are the
   answers that decide whether someone can book at all. */
const LIMITS = [
  {
    k: "Height and weight",
    v: "The chairs are built for guests between roughly 150cm and 195cm, up to 120kg. Outside that range the rollers may not line up with your spine properly.",
  },
  {
    k: "Talk to us first",
    v: "If you are pregnant, recovering from surgery, or have osteoporosis, a slipped disc, a pacemaker or any spinal injury — speak to your doctor, then message us before booking.",
  },
  {
    k: "It should not hurt",
    v: "The chair runs at level three of five by default. Turn the intensity down or press stop at any point; the chair returns to upright within seconds.",
  },
  {
    k: "What to wear",
    v: "Whatever you arrived in. The chair works through clothing and nothing needs to be removed. Shoes off, slippers provided.",
  },
]

export const metadata = {
  title: "The Chairs & Programmes",
  description:
    "Three automated programmes — fifteen, thirty or sixty minutes — in a private suite in Kigali. Prices, what each one does, and what to expect.",
}

export default function SessionsPage() {
  return (
    <main className="surface-paper" id="main-content">
      <div className="page-intro">
        <Reveal className="page-intro__inner">
          <p className="label">The chairs</p>
          <h1 className="page-title">
            The machine works.
            <br />
            You rest.
          </h1>
          <p className="page-sub">
            Three programmes, one chair, one private room. The difference
            between them is how long you have and how much of you gets covered.
          </p>
        </Reveal>
      </div>

      <div className="offpeak">
        <div className="offpeak__inner">
          <span className="offpeak__tag">{OFF_PEAK.label}</span>
          <p className="offpeak__text">
            <strong>{OFF_PEAK.window}</strong> — {OFF_PEAK.saving.toLowerCase()}
            . {OFF_PEAK.note}
          </p>
        </div>
      </div>

      {/* ── SESSION DETAIL — duration is the hero figure ── */}
      {SESSIONS.map((s, i) => (
        <section
          key={s.id}
          className={`session${i % 2 === 1 ? " session--reverse" : ""}`}
          aria-labelledby={`s-${s.id}`}
        >
          <div className="session__media">
            <Figure
              {...SESSION_IMAGES[i % SESSION_IMAGES.length]}
              sizes="(min-width: 820px) 50vw, 100vw"
            />
          </div>

          <Reveal>
            <p className="session__dur">
              <b>{s.durationMinutes}</b>
              <span>minutes</span>
            </p>
            <h2 className="session__name" id={`s-${s.id}`}>
              {s.name}
            </h2>
            <p className="session__tagline">{s.tagline}</p>

            <div className="session__prices">
              <span className="session__price-main">
                <span className="session__amount">{s.price}</span>
                <span className="session__cap">
                  Standard &middot; {s.capacity}
                </span>
              </span>
              <span className="session__price-off">
                <span className="session__amount-off">{s.offPeakPrice}</span>
                <span className="session__cap">
                  Quiet hours &middot; Mon–Fri 10–16
                </span>
              </span>
            </div>

            <p className="session__desc">{s.desc}</p>
            <p className="session__suits">
              <strong>Good for:</strong> {s.suits}
            </p>

            <ul className="session__includes">
              {s.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <Link className="btn btn--solid" href={`/book?session=${s.id}`}>
              Book {s.name.toLowerCase()}
            </Link>
          </Reveal>
        </section>
      ))}

      {/* ── BEFORE YOU BOOK ── */}
      <section className="limits surface-dim" aria-label="Before you book">
        <Reveal className="shead">
          <p className="label">Before you book</p>
          <h2 className="shead__title">Who these chairs are built for.</h2>
          <p className="shead__intro">
            We would rather turn away a booking than give you a session you
            should not have.
          </p>
        </Reveal>
        <div className="limits__grid">
          {LIMITS.map(({ k, v }) => (
            <div key={k} className="limits__item">
              <h3 className="limits__k">{k}</h3>
              <p className="limits__v">{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PARTNER ── */}
      <section
        className="partner surface-paper"
        id="partner"
        aria-label="Two suites"
      >
        <Reveal className="shead">
          <p className="label">Two suites</p>
          <h2 className="shead__title">Come with someone.</h2>
          <p className="shead__intro">
            Two private rooms side by side, booked for the same slot. You each
            set your own programme behind your own door, then meet in the lounge
            afterwards.
          </p>
        </Reveal>
        <div className="partner__grid">
          {PARTNER_SESSIONS.map((p) => (
            <div key={p.id} className="partner__card">
              <h3 className="partner__name">{p.name}</h3>
              <span className="partner__price">{p.price}</span>
              <span className="partner__cap">{p.capacity}</span>
              <p className="partner__desc">{p.desc}</p>
              <Link className="tlink" href={`/book?session=${p.id}`}>
                Book this
                <span className="tlink__arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq surface-dim" aria-labelledby="chair-faq">
        <div className="faq__inner">
          <div className="faq__grid">
            <div>
              <p className="label">Questions</p>
              <h2
                className="shead__title"
                id="chair-faq"
                style={{ marginTop: "14px" }}
              >
                Before your first session.
              </h2>
            </div>
            <Accordion items={CHAIR_FAQS} />
          </div>
        </div>
      </section>

      <section className="band" aria-label="Book">
        <p>Not sure which one? Thirty minutes is where most people start.</p>
        <Link className="btn btn--outline-light" href="/book?session=half">
          Book the half hour
        </Link>
      </section>

      <StickyBook label="From" price={SESSIONS[0].price} />
    </main>
  )
}
