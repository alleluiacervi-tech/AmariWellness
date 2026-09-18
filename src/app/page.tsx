import Link from "@/components/Link"
import Figure from "@/components/Figure"
import { SESSIONS } from "@/data/sessions"
import { SITE_CONFIG } from "@/data/site"
import { IMAGES } from "@/data/images"

export const metadata = {
  title: "Amari — A little time. Entirely yours.",
  description:
    "Private automated massage sessions in Kimihurura, Kigali. Discover your space to unwind, explore our sessions, and make time for yourself.",
}

const sessionCopy = [
  "A little breathing room in a busy day. A focused neck and shoulder programme.",
  "Time to settle in. A full-body programme with gentle warmth and a reclining chair.",
  "Give yourself an unhurried hour. Our extended programme, followed by time in the lounge.",
]
const questions = [
  {
    q: "What is an automated massage session?",
    a: "Your massage is delivered by the chair, in your own private suite. You can adjust the intensity using its control panel or stop the programme whenever you choose.",
  },
  {
    q: "What should I wear?",
    a: "Comfortable everyday clothing is ideal. The massage takes place through your clothes. Remove bulky items from your pockets before settling into the chair.",
  },
  {
    q: "Can I keep my phone with me?",
    a: "Of course. Keep it with you or use a locker during your session. Please keep calls and audio out of the quiet lounge.",
  },
  {
    q: "How is the suite prepared?",
    a: "Between sessions, the chair cover and headrest cloth are replaced, contact surfaces are cleaned, and the room is aired. Turnover time is reserved between bookings.",
  },
]

export default function HomePage() {
  return (
    <main id="main-content" className="home surface-paper">
      <section className="welcome wrap" aria-labelledby="welcome-title">
        <div className="welcome__copy">
          <p className="label welcome__eyebrow">
            <span aria-hidden="true" /> A moment of calm in Kigali
          </p>
          <h1 id="welcome-title">
            A little time.
            <br />
            <em>Entirely yours.</em>
          </h1>
          <p className="lead">
            Step out of the everyday. Settle into your own private massage
            suite, and unwind at your pace.
          </p>
          <div className="welcome__actions">
            <Link className="btn" href="/book">
              Book a session <span aria-hidden="true">↗</span>
            </Link>
            <a className="tlink" href="#the-space">
              Explore the space <span aria-hidden="true">↓</span>
            </a>
          </div>
          <p className="welcome__note">
            15, 30 or 60 minutes <span aria-hidden="true">·</span> From{" "}
            {SESSIONS[0].price}
          </p>
          <div className="welcome__location">
            <span className="label">Find your pause</span>
            <span>
              {SITE_CONFIG.address.neighborhood}, {SITE_CONFIG.address.city}
            </span>
          </div>
        </div>
        <div className="welcome__visual">
          <Figure
            {...IMAGES.suiteMood}
            eager
            sizes="(min-width: 900px) 50vw, 100vw"
          />
          <div className="welcome__caption">
            <span>YOUR SPACE TO UNWIND</span>
            <span>01 / AMARI</span>
          </div>
        </div>
      </section>

      <section className="reassurance wrap" aria-label="The Amari experience">
        <div>
          <span className="reassurance__mark" aria-hidden="true">
            01
          </span>
          <div>
            <h2>Your own private suite</h2>
            <p>A quiet space, just for you.</p>
          </div>
        </div>
        <div>
          <span className="reassurance__mark" aria-hidden="true">
            02
          </span>
          <div>
            <h2>Comfort on your terms</h2>
            <p>Adjust the intensity at any time.</p>
          </div>
        </div>
        <div>
          <span className="reassurance__mark" aria-hidden="true">
            03
          </span>
          <div>
            <h2>Stay a little longer</h2>
            <p>Lounge time with every session.</p>
          </div>
        </div>
      </section>

      <section
        className="sec surface-mist"
        id="pricing"
        aria-labelledby="sessions-title"
      >
        <div className="wrap">
          <div className="home__section-heading">
            <div>
              <p className="label">Make room for yourself</p>
              <h2 className="h1" id="sessions-title">
                A pause for every kind of day.
              </h2>
            </div>
            <Link className="tlink" href="/sessions">
              Explore our sessions ↗
            </Link>
          </div>
          <div className="session-grid">
            {SESSIONS.map((session, index) => (
              <article
                className={`session-card ${
                  index === 1 ? "session-card--featured" : ""
                }`}
                key={session.id}
              >
                <div className="session-card__top">
                  <p className="label">
                    {session.durationMinutes} minute session
                  </p>
                  {index === 1 && (
                    <span className="session-card__badge">
                      A good place to start
                    </span>
                  )}
                </div>
                <h3 className="h2">{session.name}</h3>
                <p className="body">{sessionCopy[index]}</p>
                <div className="session-card__bottom">
                  <p className="session-card__price">
                    {session.price}
                    <span>per person</span>
                  </p>
                  <Link
                    className={index === 1 ? "btn" : "btn btn--outline"}
                    href={`/book?session=${session.id}`}
                  >
                    Choose {session.durationMinutes} minutes{" "}
                    <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
          <p className="sessions-note">
            Your own suite. Your choice of intensity. Time in the lounge
            afterwards. <Link href="/packs">Discover session packs →</Link>
          </p>
        </div>
      </section>

      <section
        className="wrap sec space-story"
        id="the-space"
        aria-labelledby="space-title"
      >
        <div className="space-story__photo">
          <Figure {...IMAGES.lounge} sizes="(min-width: 900px) 50vw, 100vw" />
          <span className="space-story__caption">
            A slower rhythm, beyond your session.
          </span>
        </div>
        <div className="space-story__copy">
          <p className="label">The Amari feeling</p>
          <h2 className="h1" id="space-title">
            Come for the pause.
            <br />
            <em>Stay for the quiet.</em>
          </h2>
          <p className="lead">Some time should belong to you alone.</p>
          <p className="body">
            A private suite, a comfortable chair, and a programme you control.
            Afterwards, ease back into your day with a book, a cup of tea, or a
            few more minutes to yourself in the lounge.
          </p>
          <Link className="tlink" href="/space">
            Get to know the space ↗
          </Link>
        </div>
      </section>

      <section
        className="surface-mist sec"
        id="what"
        aria-labelledby="visit-title"
      >
        <div className="wrap">
          <div className="home__section-heading">
            <div>
              <p className="label">Your first visit</p>
              <h2 className="h1" id="visit-title">
                Easy from the moment you arrive.
              </h2>
            </div>
          </div>
          <div className="visit-grid">
            {[
              {
                title: "Choose your time",
                text: "Find the session that fits your day. Choose 15, 30, or 60 minutes when you book.",
              },
              {
                title: "Make yourself comfortable",
                text: "We’ll introduce you to your suite and chair. Set the intensity to your comfort, then settle in.",
              },
              {
                title: "Take your time",
                text: "Enjoy your session in privacy. Afterwards, the lounge is there whenever you’re ready.",
              },
            ].map((step, i) => (
              <div key={step.title}>
                <span className="visit-number">0{i + 1}</span>
                <h3 className="h3">{step.title}</h3>
                <p className="body">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap sec home-faq" aria-labelledby="faq-title">
        <div>
          <p className="label">A few things to know</p>
          <h2 className="h1" id="faq-title">
            Feel at home,
            <br />
            before you arrive.
          </h2>
          <Link className="tlink" href="/contact">
            Ask us a question ↗
          </Link>
        </div>
        <div>
          {questions.map((item) => (
            <details className="home-faq__item" key={item.q}>
              <summary>
                {item.q}
                <span aria-hidden="true">+</span>
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className="visit-banner surface-mist"
        aria-labelledby="closing-title"
      >
        <div className="wrap visit-banner__inner">
          <div>
            <p className="label">Kimihurura · Kigali</p>
            <h2 className="h1" id="closing-title">
              Your next quiet moment
              <br />
              <em>starts here.</em>
            </h2>
            <p className="body">
              {SITE_CONFIG.hours.weekdays}
              <br />
              {SITE_CONFIG.hours.weekends}
            </p>
          </div>
          <div className="visit-banner__actions">
            <Link className="btn" href="/book">
              Book a session ↗
            </Link>
            <Link className="tlink" href="/contact">
              Find us in Kigali ↗
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
