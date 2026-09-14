import Link from '@/components/Link'
import FadeIn from '@/components/FadeIn'
import Accordion from '@/components/Accordion'
import LocationCard from '@/components/LocationCard'
import Figure from '@/components/Figure'
import Placeholder from '@/components/Placeholder'
import { SPACE_FAQS, HYGIENE_PROTOCOL, SHELF } from '@/data/site'

export const metadata = {
  title: 'The Space',
  description:
    'Private automated massage suites and a small quiet reading room in Kimihurura, Kigali. What the rooms are like, and how they are kept.',
}

export default function SpacePage() {
  return (
    <main className="space-page" id="main-content">
      {/* ── HERO ── */}
      <div className="space-page__hero">
        <Placeholder shot="Wide interior — the corridor of suite doors, or the lounge seen from the entrance. This is the first impression of the space; shoot it in the best natural light of the day." />
        <div className="space-page__hero-scrim" />
        <div className="space-page__hero-title">
          <p className="label" style={{ color: 'var(--on-dark-meta)', marginBottom: '16px' }}>
            The space
          </p>
          <h1>
            Two rooms.
            <br />
            One of them is yours alone.
          </h1>
        </div>
      </div>

      {/* ── INTRO ── */}
      <FadeIn>
        <div className="space-page__intro">
          <p className="space-page__lead">
            There is the suite, which is private and locked, and there is the
            lounge, which is shared and silent.
          </p>
          <p className="space-page__body">
            The suite is a small room with one chair in it. You go in, close the
            door, and nobody else comes in until you leave. There is no attendant,
            no therapist, and no window onto the corridor. It is about as private
            as a room in a public building can be.
          </p>
          <p className="space-page__body" style={{ marginTop: '20px' }}>
            The lounge is the other half. A shelf, a few chairs, daylight, tea,
            and no music playing. It is included with every session and there is
            no time limit on it. People read, or write, or sit and do nothing at
            all — which is harder than it sounds and rather the point.
          </p>
        </div>
      </FadeIn>

      {/* ── ROOMS ── */}
      <FadeIn>
        <section className="rooms-gallery" aria-label="The rooms">
          <div className="rooms-gallery__cell">
            <Placeholder shot="A single suite with the door open — chair, side table, lamp. Show that it is genuinely a private room, not a curtained bay." />
            <p className="rooms-gallery__name">A suite</p>
          </div>
          <div className="rooms-gallery__cell">
            {/* Interim stock — verified. Note it reads as a large public library,
                so it oversells the scale of a small shelf. Replace early. */}
            <Figure
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=700&h=900&fit=crop&auto=format&q=80"
              alt="Rows of books on library shelves"
              sizes="(min-width: 900px) 33vw, 100vw"
            />
            <p className="rooms-gallery__name">The shelf</p>
          </div>
          <div className="rooms-gallery__cell">
            <Placeholder shot="The lounge with someone reading, shot from behind so nobody is identifiable. Warm, quiet, unstaged." />
            <p className="rooms-gallery__name">The lounge</p>
          </div>
        </section>
      </FadeIn>

      {/* ── HYGIENE ── */}
      <FadeIn>
        <section className="hygiene hygiene--page" aria-label="How the rooms are kept">
          <div className="hygiene__head">
            <p className="label">Between guests</p>
            <h2 className="hygiene__title">
              Someone sat here before you.
              <br />
              Here is exactly what happened next.
            </h2>
            <p className="hygiene__intro">
              This is the question nobody asks out loud, so we will answer it
              without being asked.
            </p>
          </div>
          <div className="hygiene__grid">
            {HYGIENE_PROTOCOL.map(({ label, detail }) => (
              <div key={label} className="hygiene__item">
                <h3 className="hygiene__label">{label}</h3>
                <p className="hygiene__detail">{detail}</p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      {/* ── THE SHELF ── */}
      <FadeIn>
        <section className="shelf" aria-label="The shelf">
          <div className="shelf__head">
            <p className="label">On the shelf</p>
            <h2 className="shelf__title">A small, deliberate library.</h2>
            <p className="shelf__note">{SHELF.note}</p>
          </div>
          <ul className="shelf__list">
            {SHELF.titles.map(({ title, author }) => (
              <li key={title} className="shelf__item">
                <span className="shelf__book">{title}</span>
                <span className="shelf__author">{author}</span>
              </li>
            ))}
          </ul>
        </section>
      </FadeIn>

      {/* ── ETIQUETTE ── */}
      <FadeIn>
        <section className="visit-section" aria-label="House rules">
          <div className="visit-col">
            <p className="label" style={{ marginBottom: '24px' }}>What we keep</p>
            <ul className="visit-list">
              <li>Silence in the lounge — no calls, no speaker audio</li>
              <li>Every suite private, locked from the inside</li>
              <li>Fifteen minutes of turnover between every guest</li>
              <li>Free parking on site, eight spaces</li>
              <li>Tea, still water, and no bill for either</li>
            </ul>
          </div>
          <div className="visit-col">
            <p className="label" style={{ marginBottom: '24px' }}>What we do not do</p>
            <ul className="visit-list">
              <li>Touch you — there is no therapist here at all</li>
              <li>Play music, or run screens anywhere in the building</li>
              <li>Ask you to leave when your session ends</li>
              <li>Take your phone off you, or comment on it either way</li>
              <li>Sell you anything once you are inside</li>
            </ul>
          </div>
        </section>
      </FadeIn>

      {/* ── FAQ ── */}
      <FadeIn>
        <section className="space-faq" aria-label="Questions about the space">
          <p className="label" style={{ marginBottom: '40px' }}>About the rooms</p>
          <Accordion items={SPACE_FAQS} />
        </section>
      </FadeIn>

      {/* ── LOCATION ── */}
      <FadeIn>
        <LocationCard />
      </FadeIn>

      <section className="band" aria-label="Book">
        <p>The suites are quietest in the middle of the weekday, and cost less then.</p>
        <Link className="btn btn--outline-light" href="/book">
          Book a chair
        </Link>
      </section>
    </main>
  )
}
