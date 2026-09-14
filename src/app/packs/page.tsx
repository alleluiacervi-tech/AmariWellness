import Link from '@/components/Link'
import FadeIn from '@/components/FadeIn'
import Accordion from '@/components/Accordion'
import { PACKS, GIFT_VOUCHER, CORPORATE } from '@/data/packs'
import { PACK_FAQS, SITE_CONFIG } from '@/data/site'

export const metadata = {
  title: 'Session Packs',
  description:
    'Buy sessions in advance and pay less per visit. No monthly charge, no card kept on file, no subscription to cancel. Kigali.',
}

export default function PacksPage() {
  return (
    <main className="packs-page" id="main-content">
      <div className="page-intro">
        <FadeIn>
          <p className="label">Session packs</p>
          <h1 className="packs-page__title">
            Buy several at once.
            <br />
            Pay less for each.
          </h1>
          <p className="packs-page__sub">
            There is no monthly membership here, on purpose. You buy a set of
            sessions up front, use them whenever you like, and nothing is charged
            to you again. No card on file, no standing order, nothing to remember
            to cancel.
          </p>
        </FadeIn>
      </div>

      {/* ── PACKS ── */}
      <FadeIn>
        <section className="packs" aria-label="Session packs">
          {PACKS.map(pack => (
            <article
              key={pack.id}
              className={`pack${pack.featured ? ' pack--featured' : ''}`}
            >
              {pack.featured && <span className="pack__flag">Most chosen</span>}
              <header className="pack__head">
                <h2 className="pack__name">{pack.name}</h2>
                <p className="pack__sessions">{pack.sessions}</p>
              </header>

              <div className="pack__pricing">
                <span className="pack__price">{pack.price}</span>
                <span className="pack__per">{pack.perSession}</span>
                <span className="pack__saving">{pack.saving}</span>
              </div>

              <p className="pack__desc">{pack.description}</p>

              <ul className="pack__list">
                {pack.includes.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className="pack__foot">
                <span className="pack__validity">{pack.validity}</span>
                <Link
                  className={`btn${pack.featured ? ' btn--solid' : ''}`}
                  href={`/book?pack=${pack.id}`}
                >
                  {pack.cta}
                </Link>
              </div>
            </article>
          ))}
        </section>
      </FadeIn>

      {/* ── SINGLE SESSIONS ── */}
      <FadeIn>
        <section className="packs-alt" aria-label="Single sessions">
          <div className="packs-alt__body">
            <p className="label">Not ready for a pack</p>
            <h2 className="packs-alt__title">Single sessions are always available.</h2>
            <p className="packs-alt__text">
              Nothing here requires commitment. Book one session, pay for one
              session, and decide afterwards whether you want to come back. Packs
              exist to save regular guests money, not to lock anyone in.
            </p>
            <Link className="tlink" href="/sessions">
              See single session prices →
            </Link>
          </div>
        </section>
      </FadeIn>

      {/* ── VOUCHER + CORPORATE ── */}
      <FadeIn>
        <section className="extras" aria-label="Vouchers and companies">
          <div className="extra">
            <p className="label">{GIFT_VOUCHER.name}</p>
            <h2 className="extra__title">For someone who will not book it themselves.</h2>
            <p className="extra__text">{GIFT_VOUCHER.description}</p>
            <ul className="extra__amounts">
              {GIFT_VOUCHER.amounts.map(a => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <Link className="tlink" href="/contact?subject=voucher">
              {GIFT_VOUCHER.cta} →
            </Link>
          </div>

          <div className="extra">
            <p className="label">{CORPORATE.name}</p>
            <h2 className="extra__title">A staff benefit people actually use.</h2>
            <p className="extra__text">{CORPORATE.description}</p>
            <ul className="extra__list">
              {CORPORATE.points.map(p => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <Link className="tlink" href="/contact?subject=corporate">
              {CORPORATE.cta} →
            </Link>
          </div>
        </section>
      </FadeIn>

      {/* ── FAQ ── */}
      <FadeIn>
        <section className="packs-faq" aria-label="Questions about packs">
          <p className="label" style={{ marginBottom: '40px' }}>Questions about packs</p>
          <Accordion items={PACK_FAQS} />
        </section>
      </FadeIn>

      {/* ── PAYMENT BAND ── */}
      <section className="band" aria-label="How to pay">
        <p>
          Pay with {SITE_CONFIG.payments.methods.join(', ')}. {SITE_CONFIG.payments.note}
        </p>
        <Link className="btn btn--outline-light" href="/book">
          Book a chair
        </Link>
      </section>
    </main>
  )
}
