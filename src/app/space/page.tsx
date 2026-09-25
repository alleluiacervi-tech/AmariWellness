import Bloom from "@/components/Bloom"
import CtaBand from "@/components/CtaBand"
import Faq from "@/components/Faq"
import Figure from "@/components/Figure"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import Reveal from "@/components/Reveal"
import { Check } from "@/components/icons"
import { HYGIENE_PROTOCOL, SHELF, SPACE_FAQS } from "@/data/site"
import { IMAGES } from "@/data/images"
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

export default function SpacePage() {
  return (
    <main id="main-content">
      <PageHeader
        label="The space · Kimihurura"
        title={
          <>
            Four suites, one quiet room, <em>no music.</em>
          </>
        }
        lead="One room is yours alone and locks from the inside. The other is shared, silent, and has no clock in it."
        media={IMAGES.timberRoom}
      />

      {/* ── The reading room ── */}
      <section className="wrap sec split" aria-labelledby="lounge-title">
        <Reveal className="stack items-start">
          <p className="label">The reading room</p>
          <h2 className="h2" id="lounge-title">
            A second room, <em>for after.</em>
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
        </Reveal>
        <Figure
          {...IMAGES.loungeChair}
          className="rounded ratio-4x5"
          sizes="(max-width: 860px) 100vw, 50vw"
        />
      </section>

      {/* ── The shelf ── */}
      <section className="surface-stone" aria-labelledby="shelf-title">
        <div className="wrap sec split split--top">
          <div className="stack items-start">
            <p className="label">The shelf · This month</p>
            <h2 className="h2" id="shelf-title">
              Changed each month. <em>Nothing is for sale.</em>
            </h2>
            <p className="body">{SHELF.note}</p>
          </div>
          <ul className="shelf">
            {SHELF.titles.map((book) => (
              <li key={book.title}>
                <span className="h4">{book.title}</span>
                <span className="shelf__author">{book.author}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Between every guest ── */}
      <section
        className="wrap sec protocol"
        id="between-guests"
        aria-labelledby="protocol-title"
      >
        <Reveal className="stack items-start">
          <p className="label">Between every guest</p>
          <h2 className="h2" id="protocol-title">
            Nobody sits on the cover <em>you sat on.</em>
          </h2>
          <p className="body">
            Specific numbers beat reassuring adjectives. This is what happens
            in the suite after one guest leaves and before the next comes in.
          </p>
          <div className="protocol__figure">
            <strong>15 min</strong>
            <span className="meta">
              of turnover, reserved in the schedule after every booking — never
              squeezed in while you wait.
            </span>
          </div>
        </Reveal>
        <Reveal as="ul" className="protocol__list" stagger>
          {HYGIENE_PROTOCOL.map((item) => (
            <li key={item.label}>
              <h3 className="h4">{item.label}</h3>
              <p className="small">{item.detail}</p>
            </li>
          ))}
        </Reveal>
      </section>

      {/* ── Gallery ── */}
      <section className="wrap sec--tight" aria-label="More of the space">
        <div className="gallery">
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

      <section className="surface-dim">
        <div className="wrap sec">
          <Faq
            name="space-faq"
            items={SPACE_FAQS}
            label="The room, asked about"
            title={
              <>
                Phones, laptops <em>and parking.</em>
              </>
            }
          >
            <Link className="tlink" href="/contact">
              Something else? Ask the desk <Bloom />
            </Link>
          </Faq>
        </div>
      </section>

      <CtaBand
        surface="surface-paper"
        label="Ready when you are"
        title={
          <>
            Close the door <em>behind you.</em>
          </>
        }
        body="Fifteen minutes, half an hour, or a full hour — with the lounge afterwards."
        secondary={
          <Link className="tlink" href="/sessions">
            Compare sessions <Bloom />
          </Link>
        }
      />
    </main>
  )
}
