import Link from "@/components/Link"
import Reveal from "@/components/Reveal"
import Accordion from "@/components/Accordion"
import LocationCard from "@/components/LocationCard"
import Figure from "@/components/Figure"
import { SPACE_FAQS, HYGIENE_PROTOCOL, SHELF } from "@/data/site"
import { IMAGES } from "@/data/images"

export const metadata = {
  title: "The Space",
  description:
    "Private automated massage suites and a small quiet reading room in Kimihurura, Kigali. What the rooms are like, and how they are kept.",
}

const KEEP = [
  "Silence in the lounge — no calls, no speaker audio",
  "Every suite private, locked from the inside",
  "Fifteen minutes of turnover between every guest",
  "Free parking on site, eight spaces",
  "Tea, still water, and no bill for either",
]

const NOT = [
  "Touch you — there is no therapist here at all",
  "Play music, or run screens anywhere in the building",
  "Ask you to leave when your session ends",
  "Take your phone off you, or comment on it either way",
  "Sell you anything once you are inside",
]

export default function SpacePage() {
  return (
    <main id="main-content">
      {/* ── HERO — runs under the transparent nav, full bleed ── */}
      <section className="space-hero" data-dark-top aria-label="The space">
        <div className="space-hero__media">
          <Figure {...IMAGES.architecture} eager sizes="100vw" />
        </div>
        <div className="space-hero__scrim" />
        <div className="space-hero__title">
          <p className="label" style={{ color: "var(--sage)" }}>
            The space
          </p>
          <h1>
            Two rooms.
            <br />
            One of them is yours alone.
          </h1>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="space-intro surface-paper">
        <Reveal className="space-intro__grid">
          <p className="space-intro__lead">
            There is the suite, which is private and locked, and there is the
            lounge, which is shared and silent.
          </p>
          <div>
            <p className="space-intro__body">
              The suite is a small room with one chair in it. You go in, close
              the door, and nobody else comes in until you leave. There is no
              attendant, no therapist, and no window onto the corridor. It is
              about as private as a room in a public building can be.
            </p>
            <p className="space-intro__body" style={{ marginBottom: 0 }}>
              The lounge is the other half. A shelf, a few chairs, daylight,
              tea, and no music playing. It is included with every session and
              there is no time limit on it. People read, or write, or sit and do
              nothing at all — which is harder than it sounds and rather the
              point.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── ROOMS ── */}
      <section className="rooms-gallery surface-paper" aria-label="The rooms">
        <div className="rooms-gallery__cell">
          <Figure
            {...IMAGES.quietRoom}
            sizes="(min-width: 760px) 33vw, 100vw"
          />
          <p className="rooms-gallery__name">A suite</p>
        </div>
        <div className="rooms-gallery__cell">
          <Figure {...IMAGES.shelves} sizes="(min-width: 760px) 33vw, 100vw" />
          <p className="rooms-gallery__name">The shelf</p>
        </div>
        <div className="rooms-gallery__cell">
          <Figure
            {...IMAGES.loungeChair}
            sizes="(min-width: 760px) 33vw, 100vw"
          />
          <p className="rooms-gallery__name">The lounge</p>
        </div>
      </section>

      {/* ── HYGIENE ── */}
      <section
        className="hygiene surface-dark"
        aria-label="How the rooms are kept"
      >
        <Reveal className="shead">
          <p className="label">Between guests</p>
          <h2 className="shead__title">
            Someone sat here before you. Here is exactly what happened next.
          </h2>
          <p className="shead__intro">
            This is the question nobody asks out loud, so we will answer it
            without being asked.
          </p>
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

      {/* ── THE SHELF ── */}
      <section className="shelf surface-paper" aria-label="The shelf">
        <Reveal className="shead">
          <p className="label">On the shelf</p>
          <h2 className="shead__title">A small, deliberate library.</h2>
          <p className="shead__intro">{SHELF.note}</p>
        </Reveal>
        <ul className="shelf__list">
          {SHELF.titles.map(({ title, author }) => (
            <li key={title} className="shelf__item">
              <span className="shelf__book">{title}</span>
              <span className="shelf__author">{author}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* ── HOUSE RULES — a manifesto, set like one ── */}
      <section className="rules surface-dim" aria-label="House rules">
        <Reveal className="shead">
          <p className="label">The house</p>
          <h2 className="shead__title">
            What we keep, and what we refuse to do.
          </h2>
        </Reveal>
        <div className="rules__grid">
          <div className="rules__col">
            <p className="rules__head">What we keep</p>
            <ul className="rules__list">
              {KEEP.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="rules__col rules__col--not">
            <p className="rules__head">What we do not do</p>
            <ul className="rules__list">
              {NOT.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq surface-paper" aria-labelledby="space-faq">
        <div className="faq__inner">
          <div className="faq__grid">
            <div>
              <p className="label">Questions</p>
              <h2
                className="shead__title"
                id="space-faq"
                style={{ marginTop: "14px" }}
              >
                About the rooms.
              </h2>
            </div>
            <Accordion items={SPACE_FAQS} />
          </div>
        </div>
      </section>

      {/* ── LOCATION ── */}
      <LocationCard />

      <section className="band" aria-label="Book">
        <p>
          The suites are quietest in the middle of the weekday, and cost less
          then.
        </p>
        <Link className="btn btn--outline-light" href="/book">
          Book a chair
        </Link>
      </section>
    </main>
  )
}
