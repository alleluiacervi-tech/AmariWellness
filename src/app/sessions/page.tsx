import Link from "@/components/Link"
import Bloom from "@/components/Bloom"
import Reveal from "@/components/Reveal"
import Faq from "@/components/Faq"
import { SESSIONS, OFF_PEAK } from "@/data/sessions"

export const metadata = {
  title: "Massage sessions",
  description:
    "Find your moment of calm. Compare 15, 30 and 60 minute private massage sessions at Amari in Kigali.",
}
const PROGRAMMES = [
  {
    intro: "A small pause. A fresh start.",
    description:
      "A focused neck and shoulder programme that fits comfortably into a busy day. Settle in, choose your intensity, and take a little time for yourself.",
    features: [
      "Neck and shoulder focus",
      "Adjustable intensity",
      "An easy midday pause",
    ],
  },
  {
    intro: "Room to properly unwind.",
    description:
      "A full-body programme with a reclining chair, gentle lower-back warmth, and air compression for your calves and feet. A comfortable introduction to Amari.",
    features: [
      "Full-body programme",
      "Reclining chair and lumbar warmth",
      "Calf and foot air compression",
    ],
  },
  {
    intro: "An unhurried hour, just for you.",
    description:
      "Our extended programme gives you more time to settle into each stage, with adjustable pressure, warmth, and a gentle stretch sequence. Leave a little room in your day for quiet afterwards.",
    features: [
      "Extended full-body programme",
      "Adjustable pressure and warmth",
      "Gentle stretch sequence",
    ],
  },
]
const FAQ = [
  {
    q: "What’s included with every session?",
    a: "Your own private suite, adjustable chair settings, optional locker use, and time in the lounge afterwards.",
  },
  {
    q: "Which session should I start with?",
    a: "The Half Hour gives you time to settle in and explore a full-body programme. Choose fifteen minutes for a shorter pause, or an hour when you have more time to yourself.",
  },
  {
    q: "When are quiet-hours prices available?",
    a: `Quiet-hours rates apply ${OFF_PEAK.window.toLowerCase()}. The programme and lounge access stay the same.`,
  },
  {
    q: "Can I change the intensity?",
    a: "Yes. Use the chair’s control panel to adjust your programme to your comfort, or stop the session whenever you choose.",
  },
]

export default function SessionsPage() {
  return (
    <main id="main-content" className="home sessions-page surface-paper">
      <header className="wrap sessions-intro">
        <p className="label">The sessions</p>
        <h1 className="h1">
          Find your own
          <br />
          <em>kind of pause.</em>
        </h1>
        <p className="lead">
          Fifteen minutes or a whole hour. The same private space, with a little
          more time to make it yours.
        </p>
        <nav className="session-jumps" aria-label="Jump to a session">
          {SESSIONS.map((s) => (
            <a href={`#${s.id}`} key={s.id}>
              {s.durationMinutes} minutes <Bloom />
            </a>
          ))}
        </nav>
      </header>
      <div className="session-inclusions surface-mist">
        <div className="wrap">
          <span className="label">Always included</span>
          <span>Private suite</span>
          <span>Adjustable intensity</span>
          <span>Locker use</span>
          <span>Lounge access</span>
        </div>
      </div>
      <section className="wrap programme-list" aria-label="Compare sessions">
        {SESSIONS.map((s, index) => (
          <article
            className="programme"
            id={s.id}
            key={s.id}
            aria-labelledby={`${s.id}-title`}
          >
            <div className="programme__duration">
              <span>{s.durationMinutes}</span>
              <span className="label">minutes</span>
            </div>
            <Reveal className="programme__body">
              <p className="label">
                {index === 1
                  ? "A lovely place to start"
                  : index === 0
                    ? "A pause in your day"
                    : "Take your time"}
              </p>
              <h2 className="h1" id={`${s.id}-title`}>
                {s.name}
              </h2>
              <p className="programme__intro">{PROGRAMMES[index].intro}</p>
              <p className="body">{PROGRAMMES[index].description}</p>
              <ul className="programme__features">
                {PROGRAMMES[index].features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="programme__booking">
              <dl className="programme__prices">
                <div>
                  <dt>Standard session</dt>
                  <dd>{s.price}</dd>
                </div>
                <div>
                  <dt>Quiet hours</dt>
                  <dd>{s.offPeakPrice}</dd>
                </div>
              </dl>
              <p className="meta">Per person · Your own suite</p>
              <Link className="btn" href={`/book?session=${s.id}`}>
                Book {s.durationMinutes} minutes <Bloom />
              </Link>
              <p className="programme__quiet">
                Quiet hours
                <br />
                {OFF_PEAK.window}
              </p>
            </div>
          </article>
        ))}
      </section>
      <section className="surface-mist">
        <div className="wrap sessions-packs">
          <div>
            <p className="label">Make it a little ritual</p>
            <h2 className="h2">More time for yourself.</h2>
            <p className="body">
              Explore prepaid session packs, or give someone a moment of calm.
            </p>
          </div>
          <Link className="btn btn--outline" href="/packs">
            Explore session packs <Bloom />
          </Link>
        </div>
      </section>
      <section className="wrap sec--tight">
        <Faq items={FAQ} label="Before you settle in" />
      </section>
    </main>
  )
}
