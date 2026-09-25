import type { Metadata } from "next"
import Faq from "@/components/Faq"
import Figure from "@/components/Figure"
import HeroTime from "@/components/HeroTime"
import Hours from "@/components/Hours"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import SectionHead from "@/components/SectionHead"
import { formatRWF } from "@/data/sessions"
import { IMAGES } from "@/data/images"
import { getFaqs, getPackProducts, getSessionTypes, getSiteConfig, getVisitSteps } from "@/server/db/content"
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

export default async function HomePage() {
  const [siteConfig, sessions, packs, visitSteps, questions] = await Promise.all([
    getSiteConfig(),
    getSessionTypes(),
    getPackProducts(),
    getVisitSteps(),
    getFaqs("home"),
  ])
  const { address } = siteConfig
  const halfHourRates = packs.filter((p) => p.sessionMinutes === 30).map((p) => p.perSessionNumber)
  const halfHourPackRate = halfHourRates.length > 0 ? Math.min(...halfHourRates) : 0

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
          <HeroTime sessions={sessions} schedule={siteConfig.hours.schedule} />
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
            {visitSteps.map((step) => (
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
        <Faq name="home-faq" items={questions} title="Before your first session.">
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
            <OpenStatus schedule={siteConfig.hours.schedule} />
            <Hours schedule={siteConfig.hours.schedule} />
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
