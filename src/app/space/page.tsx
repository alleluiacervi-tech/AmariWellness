import CtaBand from "@/components/CtaBand"
import Faq from "@/components/Faq"
import Figure from "@/components/Figure"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import { Check } from "@/components/icons"
import { IMAGES } from "@/data/images"
import { getFaqs, getHygieneProtocol, getShelf } from "@/server/db/content"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "The space & the shelf",
  description:
    "Four private suites, one quiet reading room, and a shelf that changes every month. No music, no clock, and fifteen minutes of turnover between every guest.",
  path: "/space",
})

const LOUNGE = [
  "Tea poured without being asked for",
  "Quiet laptop work is fine; calls are not",
  "No time limit after your session",
]

export default async function SpacePage() {
  const [shelf, hygieneProtocol, spaceFaqs] = await Promise.all([
    getShelf(),
    getHygieneProtocol(),
    getFaqs("space"),
  ])
  return (
    <main id="main-content">
      <PageHeader
        title="Four suites, one quiet room, no music."
        lead="One room is yours alone and locks from the inside. The other is shared, silent, and has no clock in it."
        media={IMAGES.timberRoom}
      />

      <section className="wrap sec split" aria-labelledby="lounge-title">
        <div className="stack items-start">
          <h2 className="h2" id="lounge-title">
            A second room, for after.
          </h2>
          <p className="body">
            Low light, deep chairs, and nobody waiting for your seat. The
            session ends; the quiet doesn&apos;t have to. Lounge access comes
            with every session, and we keep a few seats for people who only want
            the quiet — ask at reception.
          </p>
          <ul className="check-list">
            {LOUNGE.map((item) => (
              <li key={item}>
                <Check />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <Figure
          {...IMAGES.loungeChair}
          className="rounded ratio-4x5"
          sizes="(max-width: 860px) 100vw, 50vw"
        />
      </section>

      <section className="surface-stone" aria-labelledby="shelf-title">
        <div className="wrap sec split split--top">
          <div className="stack items-start">
            <h2 className="h2" id="shelf-title">
              This month&apos;s shelf.
            </h2>
            <p className="body">{shelf.note}</p>
          </div>
          <ul className="shelf">
            {shelf.titles.map((book) => (
              <li key={book.title}>
                <span className="h4">{book.title}</span>
                <span className="shelf__author">{book.author}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="wrap sec protocol"
        id="between-guests"
        aria-labelledby="protocol-title"
      >
        <div className="stack items-start">
          <h2 className="h2" id="protocol-title">
            Nobody sits on the cover you sat on.
          </h2>
          <p className="body">
            This is what happens in the suite after one guest leaves and before
            the next comes in.
          </p>
          <div className="protocol__figure">
            <strong>15 min</strong>
            <span className="meta">
              of turnover, reserved in the schedule after every booking and
              never squeezed in while you wait.
            </span>
          </div>
        </div>
        <ul className="protocol__list">
          {hygieneProtocol.map((item) => (
            <li key={item.label}>
              <h3 className="h4">{item.label}</h3>
              <p className="small">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="wrap sec--tight" aria-label="More of the space">
        {/* Scrolls sideways on phones, so it takes focus for keyboard users. */}
        <div className="gallery" tabIndex={0} role="group" aria-label="Photographs of the space">
          {[IMAGES.quietRoom, IMAGES.windowSeat, IMAGES.shelves].map((img) => (
            <Figure
              key={img.src}
              {...img}
              className="rounded ratio-4x5"
              sizes="(max-width: 720px) 78vw, 33vw"
            />
          ))}
        </div>
      </section>

      <div className="wrap sec">
        <Faq name="space-faq" items={spaceFaqs} title="Phones, laptops and parking.">
          <Link className="tlink" href="/contact">
            Ask the desk something else
          </Link>
        </Faq>
      </div>

      <CtaBand
        name="Book a session"
        title="Close the door behind you."
        body="Fifteen minutes, half an hour, or a full hour, with the lounge afterwards."
        secondary={
          <Link className="tlink" href="/sessions">
            Compare sessions
          </Link>
        }
      />
    </main>
  )
}
