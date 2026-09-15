import Link from "@/components/Link"
import Reveal from "@/components/Reveal"
import Figure from "@/components/Figure"
import Placeholder from "@/components/Placeholder"
import SessionRecommender from "@/components/SessionRecommender"
import { SESSIONS, OFF_PEAK } from "@/data/sessions"
import { SITE_CONFIG, VISIT_STEPS, HYGIENE_PROTOCOL } from "@/data/site"
import { IMAGES } from "@/data/images"

export const metadata = {
  title: "Amari — A Chair. A Quiet Room. Time to Think.",
  description:
    "Private automated massage suites in Kigali. No therapist, no appointment queue, no noise. Book a chair, close the door, and let the machine work.",
}

const FACTS = [
  {
    k: "No one touches you",
    v: "The chair is fully automated. There is no therapist and no attendant in the room.",
  },
  {
    k: "The door locks from inside",
    v: "Every suite is private and yours alone for the whole session.",
  },
  {
    k: "Fifteen minutes of turnover",
    v: "Fresh covers and a disinfected room between every single guest.",
  },
]

export default function HomePage() {
  return (
    <main id="main-content">
      {/* ── HERO — dark on every breakpoint. The room is dim; so is this. ── */}
      <section className="hero" data-dark-top aria-label="Introduction">
        <div className="hero__media">
          <Placeholder
            kind="video"
            backdrop
            shot="Silent 30-second loop of the chair running — rollers moving down the spine, the zero-gravity recline, calf compression. Shoot the day the chairs are installed. This is the single highest-value asset on the site."
          />
        </div>
        <div className="hero__scrim" />

        <div className="hero__inner">
          <div>
            <p className="hero__eyebrow label">
              Automated massage suites &middot; Kigali
            </p>
            <h1 className="hero__title">
              A chair.
              <br />A quiet room.
              <br />
              Time to think.
            </h1>
            <p className="hero__sub">
              A private room, a machine that does the work, and nobody to talk
              to. You close the door yourself. Fifteen minutes or a full hour —
              book it online and walk straight in.
            </p>
            <div className="hero__actions">
              <Link className="btn hero__cta" href="/book">
                Book a chair
              </Link>
              <Link className="hero__link tlink" href="#what">
                What actually happens
                <span className="tlink__arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          {/* The empty half of a cinematic frame is only luxurious when
              it holds something. This holds the two questions a first
              visitor actually has: how long, and how much. */}
          <div className="hero__index">
            <p className="hero__index-head">The programmes</p>
            <ul className="hero__index-list">
              {SESSIONS.map((s) => (
                <li key={s.id}>
                  <Link
                    className="hero__index-row"
                    href={`/book?session=${s.id}`}
                  >
                    <span className="hero__index-min">{s.durationMinutes}</span>
                    <span className="hero__index-name">{s.name}</span>
                    <span className="hero__index-price">{s.price}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── THE THREE FACTS ── */}
      <section className="facts surface-paper" aria-label="What to expect">
        {FACTS.map(({ k, v }) => (
          <div key={k} className="fact">
            <h2 className="fact__key">{k}</h2>
            <p className="fact__val">{v}</p>
          </div>
        ))}
      </section>

      {/* ── WHAT THIS IS ── */}
      <section className="offerings surface-paper" aria-label="What this is">
        <div className="offering">
          <div className="offering__media">
            <Figure
              {...IMAGES.suiteMood}
              sizes="(min-width: 960px) 50vw, 100vw"
            />
          </div>
          <Reveal className="offering__body">
            <p className="label">The suites</p>
            <h2 className="offering__title">
              A machine does the work.
              <br />
              You do nothing.
            </h2>
            <p className="offering__text">
              The chair measures your height and shoulders, reclines you until
              your knees sit above your heart, and then works down your spine
              with mechanical rollers while air cushions press and release
              through your calves and arms. Heat runs through the lower back
              panel. You press start and close your eyes.
            </p>
            <p className="offering__text">
              If it is too firm, turn it down. If you want it to stop, press
              stop. Nobody is watching and nobody will ask you how it was.
            </p>
            <div className="offering__price-row">
              <span className="offering__from">From</span>
              <span className="offering__amount">{SESSIONS[0].price}</span>
              <span className="offering__per">/ 15 minutes</span>
            </div>
            <Link className="tlink" href="/sessions">
              Programmes and prices
              <span className="tlink__arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </Reveal>
        </div>

        <div className="offering offering--reverse">
          <div className="offering__media">
            <Figure {...IMAGES.lounge} sizes="(min-width: 960px) 50vw, 100vw" />
          </div>
          <Reveal className="offering__body">
            <p className="label">The lounge</p>
            <h2 className="offering__title">
              Somewhere to sit
              <br />
              afterwards.
            </h2>
            <p className="offering__text">
              Most people are not ready to walk back into traffic the moment the
              chair stops. So there is a second room — a small shelf of books, a
              few good chairs, tea, and no music. Stay ten minutes or stay until
              we close.
            </p>
            <p className="offering__text">
              It is included with every session. The only rule is that it stays
              quiet: no calls, no speaker audio.
            </p>
            <Link className="tlink" href="/space">
              About the room and the shelf
              <span className="tlink__arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── WHAT ACTUALLY HAPPENS ──
          The only genuinely sequential content on the site, so the
          numbering is information. Dark ground, full width, the
          emotional centre of the page. */}
      <section
        className="visit surface-deep"
        id="what"
        aria-label="What actually happens"
      >
        <Reveal className="shead">
          <p className="label">Your first visit</p>
          <h2 className="shead__title">What actually happens.</h2>
          <p className="shead__intro">
            Most people have never used one of these. Here is the whole thing,
            start to finish, with nothing left vague.
          </p>
        </Reveal>
        <ol className="visit__steps">
          {VISIT_STEPS.map(({ step, title, body }) => (
            <li key={step} className="visit-step">
              <span className="visit-step__num">{step}</span>
              <h3 className="visit-step__title">{title}</h3>
              <p className="visit-step__body">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── SESSION MATCHER ── */}
      <section id="quiz" className="quiz-section surface-paper">
        <SessionRecommender />
      </section>

      {/* ── THE PHONE QUESTION ── */}
      <section className="locker surface-dim" aria-label="Phones and lockers">
        <div className="locker__media">
          <Placeholder shot="The lockers — brass keys, close and tactile. One key resting in an open door." />
        </div>
        <Reveal>
          <p className="label">Your phone</p>
          <h2 className="locker__title">
            Take it in, or leave it.
            <br />
            We never ask which.
          </h2>
          <p className="locker__text">
            There is a locker outside every suite and you get the key either
            way. Some people lock the phone away because that is the only way
            they will genuinely leave it alone for an hour. Others keep it on
            the armrest. Both are completely normal here.
          </p>
          <p className="locker__text">
            We are not going to take your phone off you and call it wellness.
            The choice is the point.
          </p>
        </Reveal>
      </section>

      {/* ── HYGIENE ── */}
      <section className="hygiene surface-dark" aria-label="Between guests">
        <Reveal className="shead">
          <p className="label">Between guests</p>
          <h2 className="shead__title">
            Someone sat here before you. Here is exactly what happened next.
          </h2>
        </Reveal>
        <div className="hygiene__grid">
          {HYGIENE_PROTOCOL.map(({ label, detail }) => (
            <div key={label} className="hygiene__item">
              <h3 className="hygiene__label">{label}</h3>
              <p className="hygiene__detail">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section
        className="price-strip surface-paper"
        id="pricing"
        aria-label="Prices"
      >
        <div className="price-strip__head">
          <p className="label">Prices</p>
          <p className="price-strip__note">
            Paid when you book. Free cancellation up to four hours before.
          </p>
        </div>
        <div className="price-strip__grid">
          {SESSIONS.map((s) => (
            <div key={s.id} className="price-strip__item">
              <span className="price-strip__amount">{s.price}</span>
              <span className="price-strip__desc">
                {s.name} &middot; {s.duration}
              </span>
              <span className="price-strip__off">
                {s.offPeakPrice} in quiet hours
              </span>
              <Link
                href={`/book?session=${s.id}`}
                className="tlink price-strip__link"
              >
                Book this
                <span className="tlink__arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          ))}
          <div className="price-strip__item price-strip__item--alt">
            <span className="price-strip__amount">&minus;20%</span>
            <span className="price-strip__desc">
              {OFF_PEAK.label} &middot; {OFF_PEAK.window}
            </span>
            <span className="price-strip__off">{OFF_PEAK.note}</span>
            <Link href="/packs" className="tlink price-strip__link">
              Session packs
              <span className="tlink__arrow" aria-hidden="true">
                &rarr;
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="quote surface-dim" aria-label="Why this exists">
        <div className="quote__rule" />
        <blockquote>
          Some things only become clear when you stop moving long enough to hear
          them.
        </blockquote>
      </section>

      {/* ── CTA BAND ── */}
      <section className="band" id="book" aria-label="Book a session">
        <p>
          {SITE_CONFIG.hours.weekdays} &middot; {SITE_CONFIG.hours.weekends}.
          Book online, or walk in when a suite is free.
        </p>
        <Link className="btn btn--outline-light" href="/book">
          Book a chair
        </Link>
      </section>
    </main>
  )
}
