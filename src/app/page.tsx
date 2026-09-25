import type { Metadata } from "next"
import Faq from "@/components/Faq"
import Figure from "@/components/Figure"
import HeroTime from "@/components/HeroTime"
import Hours from "@/components/Hours"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import SectionHead from "@/components/SectionHead"
import { formatRWF } from "@/data/sessions"
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

const halfHourPackRate = Math.min(
  ...PACKS.filter((p) => p.sessionMinutes === 30).map((p) => p.perSessionNumber),
)

export default function HomePage() {
  const { address } = SITE_CONFIG

  return (
    <main id="main-content">
      <section className="wrap hero" aria-labelledby="hero-title">
        <div className="hero__copy enter">
          <h1 className="display hero__title" id="hero-title">
            <span>A chair.</span>
            <span>A quiet room.</span>
            <span>Time to think.</span>
          </h1>
          <p className="lead hero__lead">
            A private suite that locks from the inside, a chair that does the
            work, and the lounge afterwards for as long as you like. In{" "}
            {address.neighborhood}, {address.city}.
          </p>
          <HeroTime />
        </div>

        <div className="hero__visual enter-media">
          <Figure
            {...IMAGES.suiteMood}
            eager
            className="arch"
            sizes="(max-width: 720px) 100vw, (max-width: 1320px) 46vw, 600px"
          />
        </div>
      </section>

      <section className="wrap sec split" id="the-space" aria-labelledby="space-title">
        <div>
          <Figure
            {...IMAGES.lounge}
            className="rounded ratio-7x8"
            sizes="(max-width: 860px) 100vw, 50vw"
          />
          <span className="caption">The lounge, for afterwards.</span>
        </div>
        <div className="stack items-start">
          <h2 className="h2" id="space-title">
            Somewhere to sit afterwards.
          </h2>
          <p className="lead">Some time should belong to you alone.</p>
          <p className="body">
            When the programme ends, the reading room is yours. A book from
            the shelf, a cup of tea, a few more minutes with your eyes shut.
            There is no clock on the wall and nobody waiting for your seat.
          </p>
          <Link className="tlink" href="/space">
            See the suites and the lounge
          </Link>
        </div>
      </section>

      <section className="surface-stone sec" id="first-visit" aria-labelledby="visit-title">
        <div className="wrap">
          <SectionHead
            id="visit-title"
            title="What happens on your first visit."
            intro="Timed for a half-hour session, from the moment the door closes. No forms at the door, no small talk, nobody in the room."
          />
          <ol className="timeline">
            {VISIT_STEPS.map((step) => (
              <li className="timeline__step" key={step.title}>
                <span className="timeline__time">{step.time}</span>
                <h3 className="h4">{step.title}</h3>
                <p className="small">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="wrap sec">
        <Faq name="home-faq" items={QUESTIONS} title="Before your first session.">
          <p className="small">
            Anything else, health questions included, the desk answers on
            WhatsApp within the hour.
          </p>
          <Link className="tlink" href="/contact">
            Ask a question
          </Link>
        </Faq>
      </div>

      <section className="surface-deep" aria-labelledby="closing-title">
        <div className="wrap closing__inner">
          <div className="closing__copy">
            <h2 className="h1" id="closing-title">
              Your next quiet hour starts here.
            </h2>
            <p className="lead">
              Book online in under a minute, or walk in when a suite is free.
              Coming often? Packs bring a half hour down to{" "}
              <span className="data">{formatRWF(halfHourPackRate)}</span>.
            </p>
          </div>
          <div className="closing__aside">
            <OpenStatus />
            <Hours />
            <div className="cluster">
              <Link className="btn" href="/book">
                Book a session
              </Link>
              <Link className="tlink" href="/contact">
                Get directions
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
