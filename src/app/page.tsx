import Link from "@/components/Link"
import Reveal from "@/components/Reveal"
import Figure from "@/components/Figure"
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
  { k: "No one touches you", v: "The chair is fully automated. There is no therapist and no attendant in the room." },
  { k: "The door locks from inside", v: "Every suite is private and yours alone for the whole session." },
  { k: "Fifteen minutes of turnover", v: "Fresh covers and a disinfected room between every single guest." },
]

export default function HomePage() {
  return (
    <main id="main-content">
      {/* ── HERO — the room is dim; so is this ── */}
      <section className="hero surface-deep" data-dark-top aria-label="Introduction">
        <div className="hero__media">
          <img src={IMAGES.suiteMood.src} alt={IMAGES.suiteMood.alt} />
        </div>
        <div className="hero__scrim" />
        <div className="hero__inner">
          <div className="hero__body rise">
            <p className="label">Automated massage suites · Kigali</p>
            <h1 className="display" style={{ marginTop: 22 }}>
              A chair.
              <br />A quiet room.
              <br />Time to think.
            </h1>
            <p className="lead" style={{ marginTop: 26, maxWidth: "48ch" }}>
              A private room, a machine that does the work, and nobody to talk to. You close the
              door yourself. Fifteen minutes or a full hour — book it online and walk straight in.
            </p>
            <div className="hero__actions">
              <Link className="btn" href="/book">Book a chair</Link>
              <a className="tlink" href="#what">What actually happens &rarr;</a>
            </div>
          </div>

          {/* The two questions a first visitor actually has: how long, how much. */}
          <div className="hero__index rise rise--1">
            <p className="label" style={{ margin: "16px 0 6px" }}>The programmes</p>
            {SESSIONS.map((s) => (
              <Link key={s.id} className="hero__row" href={`/book?session=${s.id}`}>
                <span className="hero__min">{s.durationMinutes}</span>
                <span className="hero__name">{s.name}</span>
                <span className="hero__price">{s.price}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE THREE FACTS ── */}
      <section className="surface-paper" style={{ borderBottom: "1px solid var(--s-rule)" }} aria-label="What to expect">
        <div className="wrap grid-3" style={{ paddingBlock: "clamp(40px, 6vw, 64px)" }}>
          {FACTS.map(({ k, v }) => (
            <div key={k} className="stack--tight">
              <h2 className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 26 }}>{k}</h2>
              <p className="meta" style={{ fontSize: 16 }}>{v}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT THIS IS ── */}
      <section className="surface-paper" aria-label="What this is">
        <div className="wrap sec stack" style={{ gap: "var(--section)" }}>
          <div className="grid-2" style={{ alignItems: "center" }}>
            <div className="figure--wide">
              <Figure {...IMAGES.suiteMood} sizes="(min-width: 960px) 50vw, 100vw" />
            </div>
            <Reveal className="stack">
              <p className="label">The suites</p>
              <h2 className="h2">A machine does the work.<br />You do nothing.</h2>
              <p className="body">
                The chair measures your height and shoulders, reclines you until your knees sit
                above your heart, then works down your spine with mechanical rollers while air
                cushions press and release through your calves and arms. Heat runs through the
                lower back panel. You press start and close your eyes.
              </p>
              <p className="body">
                If it is too firm, turn it down. If you want it to stop, press stop. Nobody is
                watching and nobody will ask you how it was.
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, borderTop: "1px solid var(--s-rule)", paddingTop: 18 }}>
                <span className="label">From</span>
                <span className="data--lg">{SESSIONS[0].price}</span>
                <span className="data">/ 15 min</span>
              </div>
              <Link className="tlink" href="/sessions">Programmes and prices &rarr;</Link>
            </Reveal>
          </div>

          <div className="grid-2" style={{ alignItems: "center" }}>
            <Reveal className="stack" style={{ order: 2 }}>
              <p className="label">The lounge</p>
              <h2 className="h2">Somewhere to sit<br />afterwards.</h2>
              <p className="body">
                Most people are not ready to walk back into traffic the moment the chair stops. So
                there is a second room — a small shelf of books, a few good chairs, tea, and no
                music. Stay ten minutes or stay until we close.
              </p>
              <p className="body">
                It is included with every session. The only rule is that it stays quiet: no calls,
                no speaker audio.
              </p>
              <Link className="tlink" href="/space">About the room and the shelf &rarr;</Link>
            </Reveal>
            <div className="figure--wide">
              <Figure {...IMAGES.lounge} sizes="(min-width: 960px) 50vw, 100vw" />
            </div>
          </div>
        </div>
      </section>

      {/* ── WHAT ACTUALLY HAPPENS — the only sequential content on the site ── */}
      <section className="surface-deep" id="what" aria-label="What actually happens">
        <div className="wrap sec stack" style={{ gap: "clamp(44px, 6vw, 76px)" }}>
          <Reveal className="rail">
            <div className="rail__label"><p className="label">Your first visit</p></div>
            <div className="rail__body">
              <h2 className="h1">What actually happens.</h2>
              <p className="lead" style={{ marginTop: 20 }}>
                Most people have never used one of these. Here is the whole thing, start to finish,
                with nothing left vague.
              </p>
            </div>
          </Reveal>
          <ol className="rule-grid" style={{ listStyle: "none", margin: 0, padding: 0, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {VISIT_STEPS.map(({ step, title, body }) => (
              <li key={step} className="stack--tight">
                <span className="data">{step}</span>
                <h3 className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 25 }}>{title}</h3>
                <p className="meta">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── SESSION MATCHER ── */}
      <section className="surface-paper" id="quiz">
        <div className="wrap sec">
          <SessionRecommender />
        </div>
      </section>

      {/* ── THE PHONE QUESTION ── */}
      <section className="surface-dim" aria-label="Phones and lockers">
        <div className="wrap sec grid-2" style={{ alignItems: "center" }}>
          <div className="figure--tall figure--locker">
            <Figure {...IMAGES.readingLamp} sizes="(min-width: 960px) 50vw, 100vw" />
          </div>
          <Reveal className="stack">
            <p className="label">Your phone</p>
            <h2 className="h2">Take it in, or leave it.<br />We never ask which.</h2>
            <p className="body">
              There is a locker outside every suite and you get the key either way. Some people
              lock the phone away because that is the only way they will genuinely leave it alone
              for an hour. Others keep it on the armrest. Both are completely normal here.
            </p>
            <p className="body">
              We are not going to take your phone off you and call it wellness. The choice is the point.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── HYGIENE ── */}
      <section className="surface-dark" aria-label="Between guests">
        <div className="wrap sec stack" style={{ gap: "clamp(40px, 6vw, 68px)" }}>
          <Reveal className="rail">
            <div className="rail__label"><p className="label">Between guests</p></div>
            <h2 className="rail__body h2" style={{ maxWidth: "30ch" }}>
              Someone sat here before you. Here is exactly what happened next.
            </h2>
          </Reveal>
          <div className="grid-3">
            {HYGIENE_PROTOCOL.map(({ label, detail }) => (
              <div key={label} className="stack--tight" style={{ borderTop: "1px solid var(--s-rule-2)", paddingTop: 20 }}>
                <h3 className="data" style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 400 }}>{label}</h3>
                <p className="meta">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICES ── */}
      <section className="surface-paper" id="pricing" aria-label="Prices">
        <div className="wrap sec stack" style={{ gap: 40 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--s-rule-2)", paddingBottom: 18 }}>
            <p className="label">Prices</p>
            <p className="meta">Paid when you book. Free cancellation up to four hours before.</p>
          </div>
          <div className="rule-grid">
            {SESSIONS.map((s) => (
              <div key={s.id} className="stack--tight">
                <span className="data--lg">{s.price}</span>
                <span className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 22 }}>{s.name}</span>
                <span className="data" style={{ fontSize: 11, color: "var(--s-meta)" }}>
                  {s.duration} · {s.offPeakPrice} quiet hours
                </span>
                <Link className="tlink" href={`/book?session=${s.id}`} style={{ marginTop: 8 }}>Book this &rarr;</Link>
              </div>
            ))}
            <div className="stack--tight" style={{ background: "var(--s-raised)" }}>
              <span className="data--lg">&minus;20%</span>
              <span className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 22 }}>{OFF_PEAK.label}</span>
              <span className="data" style={{ fontSize: 11, color: "var(--s-meta)" }}>{OFF_PEAK.window}</span>
              <Link className="tlink" href="/packs" style={{ marginTop: 8 }}>Session packs &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section className="surface-dim" aria-label="Why this exists">
        <div className="wrap sec" style={{ maxWidth: 1000, textAlign: "center" }}>
          <div className="hairline" style={{ height: 56, margin: "0 auto 32px" }} />
          <blockquote className="quote">
            Some things only become clear when you stop moving long enough to hear them.
          </blockquote>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="surface-sage" id="book" aria-label="Book a session">
        <div className="wrap" style={{ paddingBlock: "clamp(44px, 6vw, 72px)", display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", justifyContent: "space-between" }}>
          <p className="body" style={{ maxWidth: "52ch" }}>
            {SITE_CONFIG.hours.weekdays} · {SITE_CONFIG.hours.weekends}. Book online, or walk in
            when a suite is free.
          </p>
          <Link className="btn btn--outline" href="/book">Book a chair</Link>
        </div>
      </section>
    </main>
  )
}
