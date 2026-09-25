import type { Metadata } from "next"
import Bloom from "@/components/Bloom"
import Dial from "@/components/Dial"
import Faq from "@/components/Faq"
import Figure from "@/components/Figure"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import Reveal from "@/components/Reveal"
import SectionHead from "@/components/SectionHead"
import { Arrow, Cup, Door, Sliders } from "@/components/icons"
import { FEATURED_SESSION_ID, SESSIONS, formatRWF } from "@/data/sessions"
import { PACKS } from "@/data/packs"
import { SITE_CONFIG, VISIT_STEPS } from "@/data/site"
import { IMAGES } from "@/data/images"
import { OPEN_GRAPH_BASE } from "@/lib/metadata"

const DESCRIPTION =
  "Private automated massage suites in Kimihurura, Kigali. No therapist, no noise — you close the door yourself. Book online from 8,000 RWF."

export const metadata: Metadata = {
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    ...OPEN_GRAPH_BASE,
    title: "Amari — A chair. A quiet room. Time to think.",
    description: DESCRIPTION,
    url: "/",
  },
}

const ASSURANCES = [
  { Icon: Door, title: "Your own private suite", body: "It locks from the inside. Nobody comes in." },
  { Icon: Sliders, title: "Comfort on your terms", body: "Change the intensity, or stop, at any moment." },
  { Icon: Cup, title: "Stay a little longer", body: "The lounge is yours afterwards, no time limit." },
]

const QUESTIONS = [
  {
    q: "What is an automated massage session?",
    a: "Your massage is delivered by the chair, in your own private suite. There is no therapist and nobody else in the room. You set the intensity on the control panel and can stop the programme whenever you choose.",
  },
  {
    q: "What should I wear?",
    a: "Whatever you arrived in, as long as it is comfortable. The chair works through clothing. We ask you to take your shoes off — slippers are provided — and to empty your back pockets.",
  },
  {
    q: "Can I keep my phone with me?",
    a: "Of course. Keep it with you or lock it away; we hand you a locker key either way and never ask which you chose. The one rule is that the lounge stays silent.",
  },
  {
    q: "How is the suite prepared between guests?",
    a: "The chair cover and headrest cloth are replaced with a freshly laundered set, every contact surface is disinfected, and the room is aired. Fifteen minutes are reserved after every booking for it.",
  },
]

const featured = SESSIONS.find((s) => s.id === FEATURED_SESSION_ID) ?? SESSIONS[1]
const lowestPackRate = PACKS.filter((p) => p.sessionMinutes === 30).reduce(
  (low, p) => (p.perSessionNumber < low.perSessionNumber ? p : low),
)

export default function HomePage() {
  const { hours, address } = SITE_CONFIG

  return (
    <main id="main-content">
      {/* ── Hero ── */}
      <section className="wrap hero" aria-labelledby="hero-title">
        <div className="hero__copy enter">
          <p className="label">Private massage suites · {address.city}</p>
          <h1 className="display hero__title" id="hero-title">
            A chair.
            <br />
            A quiet room.
            <br />
            <em>Time to think.</em>
          </h1>
          <p className="lead hero__lead">
            A private room, a machine that does the work, and nobody to talk
            to. You close the door yourself.
          </p>
          <div className="hero__actions">
            <Link className="btn" href="/book">
              Book a session <Arrow />
            </Link>
            <Link className="tlink" href="#the-space">
              Explore the space <Bloom />
            </Link>
          </div>
          <div className="hero__note">
            <p className="hero__facts">
              <span>15 · 30 · 60 min</span>
              <span>From {SESSIONS[0].price}</span>
            </p>
            <OpenStatus />
          </div>
        </div>

        <div className="hero__visual enter-media">
          <Figure
            {...IMAGES.suiteMood}
            eager
            className="arch"
            sizes="(max-width: 720px) 100vw, (max-width: 1320px) 48vw, 620px"
          />
          <Link className="hero__card" href={`/book?session=${featured.id}`}>
            <Dial minutes={featured.durationMinutes} />
            <span className="hero__card-copy">
              <span>Where most people start</span>
              <strong>{featured.name}</strong>
              <span className="data">{featured.price}</span>
            </span>
          </Link>
        </div>
      </section>

      <div className="wrap">
        <ul className="assurances" aria-label="What every session includes">
          {ASSURANCES.map(({ Icon, title, body }) => (
            <li className="assurance" key={title}>
              <Icon />
              <p className="meta">
                <strong>{title}</strong>
                {body}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Sessions ── */}
      <section className="sec surface-mist" id="sessions" aria-labelledby="sessions-title">
        <div className="wrap">
          <SectionHead
            id="sessions-title"
            label="Make room for yourself"
            title={
              <>
                Fifteen minutes, <em>or a full hour.</em>
              </>
            }
            action={
              <Link className="tlink" href="/sessions">
                Compare sessions <Bloom />
              </Link>
            }
          />
          <Reveal className="session-grid" stagger>
            {SESSIONS.map((s) => {
              const isFeatured = s.id === featured.id
              return (
                <article
                  key={s.id}
                  className={`session-card ${isFeatured ? "session-card--featured" : ""}`}
                  aria-labelledby={`card-${s.id}`}
                >
                  <div className="session-card__head">
                    <Dial minutes={s.durationMinutes} />
                    {isFeatured ? (
                      <span className="tag">A good place to start</span>
                    ) : (
                      <span className="label">{s.label}</span>
                    )}
                  </div>
                  <h3 className="h3" id={`card-${s.id}`}>
                    {s.name}
                  </h3>
                  <p className="small">{s.summary}</p>
                  <div className="session-card__foot">
                    <p className="price">
                      {s.price}
                      <small>
                        per person · {s.offPeakPrice} in quiet hours
                      </small>
                    </p>
                    <Link
                      className={isFeatured ? "btn btn--block" : "btn btn--outline btn--block"}
                      href={`/book?session=${s.id}`}
                    >
                      Book {s.durationMinutes} minutes <Arrow />
                    </Link>
                  </div>
                </article>
              )
            })}
          </Reveal>
          <p className="session-note">
            <span>
              Coming back? Packs bring a half hour down to{" "}
              <span className="data">{formatRWF(lowestPackRate.perSessionNumber)}</span>.
            </span>
            <Link className="tlink" href="/packs">
              See session packs <Bloom />
            </Link>
          </p>
        </div>
      </section>

      {/* ── The space ── */}
      <section className="wrap sec split" id="the-space" aria-labelledby="space-title">
        <div>
          <Figure
            {...IMAGES.lounge}
            className="rounded ratio-7x8"
            sizes="(max-width: 860px) 100vw, 50vw"
          />
          <span className="caption">The lounge — for afterwards, for as long as you like.</span>
        </div>
        <Reveal className="stack items-start">
          <p className="label">The Amari feeling</p>
          <h2 className="h2" id="space-title">
            Somewhere to sit <em>afterwards.</em>
          </h2>
          <p className="lead">Some time should belong to you alone.</p>
          <p className="body">
            A private suite, a comfortable chair, and a programme you control.
            Afterwards, ease back into your day with a book from the shelf, a
            cup of tea, or a few more minutes to yourself in the lounge. There
            is no clock on the wall.
          </p>
          <Link className="tlink" href="/space">
            Get to know the space <Bloom />
          </Link>
        </Reveal>
      </section>

      {/* ── First visit ── */}
      <section className="surface-stone sec" id="first-visit" aria-labelledby="visit-title">
        <div className="wrap">
          <SectionHead
            id="visit-title"
            label="Your first visit"
            title={
              <>
                What actually <em>happens.</em>
              </>
            }
            intro="Read off the clock, from the moment you walk in. No forms at the door, no small talk, nobody in the room."
          />
          <Reveal as="ol" className="timeline" stagger>
            {VISIT_STEPS.map((step) => (
              <li className="timeline__step" key={step.title}>
                <span className="timeline__time">{step.time}</span>
                <h3 className="h4">{step.title}</h3>
                <p className="small">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── Questions ── */}
      <div className="wrap sec">
        <Faq
          name="home-faq"
          items={QUESTIONS}
          label="A few things to know"
          title={
            <>
              Before your <em>first session.</em>
            </>
          }
        >
          <p className="small">
            Anything else — health questions included — the desk answers on
            WhatsApp within the hour.
          </p>
          <Link className="tlink" href="/contact">
            Ask us a question <Bloom />
          </Link>
        </Faq>
      </div>

      {/* ── Close ── */}
      <section className="surface-deep" aria-labelledby="closing-title">
        <div className="wrap closing__inner">
          <Reveal className="closing__copy">
            <p className="label">
              {address.neighborhood} · {address.city}
            </p>
            <h2 className="h1" id="closing-title">
              Your next quiet moment <em>starts here.</em>
            </h2>
            <p className="lead">
              Book online in under a minute, or walk in when a suite is free.
            </p>
          </Reveal>
          <div className="closing__aside">
            <OpenStatus />
            <p className="closing__hours">
              {hours.weekdays}
              <br />
              {hours.weekends}
            </p>
            <div className="cluster">
              <Link className="btn" href="/book">
                Book a session <Arrow />
              </Link>
              <Link className="tlink" href="/contact">
                Find us <Bloom />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
