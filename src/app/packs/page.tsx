import Link from "@/components/Link"
import Reveal from "@/components/Reveal"
import Accordion from "@/components/Accordion"
import Figure from "@/components/Figure"
import { PACKS, GIFT_VOUCHER, CORPORATE } from "@/data/packs"
import { PACK_FAQS, SITE_CONFIG } from "@/data/site"
import { IMAGES } from "@/data/images"

export const metadata = {
  title: "Session Packs",
  description:
    "Buy sessions in advance and pay less per visit. No monthly charge, no card kept on file, no subscription to cancel. Kigali.",
}

export default function PacksPage() {
  return (
    <main className="surface-paper" id="main-content">
      <div className="page-intro">
        <Reveal className="page-intro__inner">
          <p className="label">Session packs</p>
          <h1 className="page-title">
            Buy several at once.
            <br />
            Pay less for each.
          </h1>
          <p className="page-sub">
            There is no monthly membership here, on purpose. You buy a set of
            sessions up front, use them whenever you like, and nothing is
            charged to you again. No card on file, no standing order, nothing to
            remember to cancel.
          </p>
        </Reveal>
      </div>

      {/* ── PACKS — hairline columns, same language as the price strip ── */}
      <section className="packs" aria-label="Session packs">
        {PACKS.map((pack) => (
          <article
            key={pack.id}
            className={`pack${pack.featured ? " pack--featured" : ""}`}
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
              {/* Expiry is the term most likely to cause regret, so it
                  sits with the price rather than in grey at the bottom. */}
              <span className="pack__validity">{pack.validity}</span>
            </div>

            <p className="pack__desc">{pack.description}</p>

            <ul className="pack__list">
              {pack.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="pack__foot">
              <Link
                className={`btn ${
                  pack.featured ? "btn--solid" : "btn--outline"
                }`}
                href={`/book?pack=${pack.id}`}
              >
                {pack.cta}
              </Link>
            </div>
          </article>
        ))}
      </section>

      {/* ── ONE MOMENT OF ATMOSPHERE ON THE MONEY PAGE ── */}
      <section
        className="offering offering--reverse surface-dim"
        aria-label="Single sessions"
      >
        <div className="offering__media">
          <Figure
            {...IMAGES.loungeChair}
            sizes="(min-width: 960px) 50vw, 100vw"
          />
        </div>
        <Reveal className="offering__body">
          <p className="label">Not ready for a pack</p>
          <h2 className="offering__title">
            Single sessions are always available.
          </h2>
          <p className="offering__text">
            Nothing here requires commitment. Book one session, pay for one
            session, and decide afterwards whether you want to come back. Packs
            exist to save regular guests money, not to lock anyone in.
          </p>
          <Link className="tlink" href="/sessions">
            See single session prices
            <span className="tlink__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ── VOUCHER + CORPORATE ── */}
      <section
        className="extras surface-paper"
        aria-label="Vouchers and companies"
      >
        <Reveal className="extra">
          <p className="label">{GIFT_VOUCHER.name}</p>
          <h2 className="extra__title">
            For someone who will not book it themselves.
          </h2>
          <p className="extra__text">{GIFT_VOUCHER.description}</p>
          <ul className="extra__amounts">
            {GIFT_VOUCHER.amounts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <Link className="tlink" href="/contact?subject=voucher">
            {GIFT_VOUCHER.cta}
            <span className="tlink__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </Reveal>

        <Reveal className="extra">
          <p className="label">{CORPORATE.name}</p>
          <h2 className="extra__title">A staff benefit people actually use.</h2>
          <p className="extra__text">{CORPORATE.description}</p>
          <ul className="extra__list">
            {CORPORATE.points.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <Link className="tlink" href="/contact?subject=corporate">
            {CORPORATE.cta}
            <span className="tlink__arrow" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section className="faq surface-dark" aria-labelledby="pack-faq">
        <div className="faq__inner">
          <div className="faq__grid">
            <div>
              <p className="label">Questions</p>
              <h2
                className="shead__title"
                id="pack-faq"
                style={{ marginTop: "14px" }}
              >
                How packs work.
              </h2>
            </div>
            <Accordion items={PACK_FAQS} />
          </div>
        </div>
      </section>

      <section className="band" aria-label="How to pay">
        <p>
          Pay with {SITE_CONFIG.payments.methods.join(", ")}. Cancel free up to
          four hours before.
        </p>
        <Link className="btn btn--outline-light" href="/book">
          Book a chair
        </Link>
      </section>
    </main>
  )
}
