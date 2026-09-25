import Bloom from "@/components/Bloom"
import CtaBand from "@/components/CtaBand"
import Dial from "@/components/Dial"
import Faq from "@/components/Faq"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import Reveal from "@/components/Reveal"
import { Arrow, Check } from "@/components/icons"
import { INCLUDED, OFF_PEAK, SESSIONS } from "@/data/sessions"
import { PACKS } from "@/data/packs"
import { CHAIR_FAQS } from "@/data/site"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Sessions & prices",
  description:
    "Compare 15, 30 and 60 minute private massage sessions at Amari in Kigali, with quiet-hours prices on weekday afternoons.",
  path: "/sessions",
})

const chair = (q: string) => CHAIR_FAQS.find((f) => f.q.startsWith(q))!

const QUESTIONS = [
  {
    q: "Which session should I start with?",
    a: "The Half Hour. It is long enough to properly unwind and covers you from neck to feet. Choose fifteen minutes for a shorter reset, or the full hour once you know you like it.",
  },
  {
    q: "When are quiet-hours prices available?",
    a: `Quiet-hours rates apply ${OFF_PEAK.window}. ${OFF_PEAK.note}`,
  },
  chair("Does it hurt?"),
  chair("Is anyone in the room"),
  chair("Is there a height"),
  chair("Can I use it if I am pregnant"),
]

const halfHourPack = PACKS.find((p) => p.featured) ?? PACKS[0]

export default function SessionsPage() {
  return (
    <main id="main-content">
      <PageHeader
        label="The sessions"
        title={
          <>
            Find your own <em>kind of pause.</em>
          </>
        }
        lead="Fifteen minutes or a whole hour. The same private suite, with a little more time to make it yours."
      >
        <nav className="jump-links" aria-label="Jump to a session">
          {SESSIONS.map((s) => (
            <a className="chip" href={`#${s.id}`} key={s.id}>
              {s.durationMinutes} min
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="surface-mist">
        <div className="wrap inclusions">
          <span className="label">Always included</span>
          <ul>
            {INCLUDED.map((item) => (
              <li key={item}>
                <Check />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="wrap">
        {SESSIONS.map((s) => (
          <article
            className="programme"
            id={s.id}
            key={s.id}
            aria-labelledby={`${s.id}-title`}
          >
            <div className="programme__dial">
              <Dial minutes={s.durationMinutes} size="lg" />
            </div>
            <Reveal className="programme__body">
              <p className="label">{s.label}</p>
              <h2 className="h2" id={`${s.id}-title`}>
                {s.name}
              </h2>
              <p className="programme__intro">{s.intro}</p>
              <p className="body">{s.about}</p>
              <ul className="check-list">
                {s.highlights.map((h) => (
                  <li key={h}>
                    <Check />
                    {h}
                  </li>
                ))}
              </ul>
            </Reveal>
            <aside className="programme__aside" aria-label={`${s.name} prices`}>
              <dl className="programme__prices">
                <div>
                  <dt>Standard</dt>
                  <dd>{s.price}</dd>
                </div>
                <div>
                  <dt>Quiet hours</dt>
                  <dd>{s.offPeakPrice}</dd>
                </div>
              </dl>
              <p className="meta">
                Per person, in your own suite. Quiet hours run{" "}
                {OFF_PEAK.window.replace("Monday to Friday", "weekdays")}.
              </p>
              <Link className="btn btn--block" href={`/book?session=${s.id}`}>
                Book {s.durationMinutes} minutes <Arrow />
              </Link>
            </aside>
          </article>
        ))}
      </div>

      <CtaBand
        label="Make it a little ritual"
        title={
          <>
            More time for yourself, <em>for less.</em>
          </>
        }
        body={`Prepaid packs bring a half hour down to ${halfHourPack.perSession}. Shareable, no subscription, no card on file.`}
        href="/packs"
        cta="See session packs"
        secondary={
          <Link className="tlink" href="/packs#voucher">
            Or give one as a gift <Bloom />
          </Link>
        }
      />

      <div className="wrap sec">
        <Faq
          name="sessions-faq"
          items={QUESTIONS}
          label="Before you settle in"
          title={
            <>
              Honest answers, <em>before you book.</em>
            </>
          }
        >
          <p className="small">
            If you have a medical condition, talk to your doctor first — then
            talk to us. We would rather turn a booking away than give you a
            session you should not have.
          </p>
          <Link className="tlink" href="/contact">
            Ask the desk <Bloom />
          </Link>
        </Faq>
      </div>
    </main>
  )
}
