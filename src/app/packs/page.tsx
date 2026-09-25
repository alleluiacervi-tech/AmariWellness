import Faq from "@/components/Faq"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import SectionHead from "@/components/SectionHead"
import { Check } from "@/components/icons"
import { CORPORATE, GIFT_VOUCHER, PACK_BASICS, PACKS } from "@/data/packs"
import { formatRWF } from "@/data/sessions"
import { PACK_FAQS } from "@/data/site"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Session packs, gift vouchers & companies",
  description:
    "Buy sessions up front at a lower price per session. No monthly charge, no card on file, no subscription to cancel. Gift vouchers and company accounts too.",
  path: "/packs",
})

export default function PacksPage() {
  return (
    <main id="main-content">
      <PageHeader
        title="Pay once. Come back whenever you like."
        lead="No monthly charge, no card on file, no subscription to cancel. Your balance sits against your phone number and comes off when you book."
      />

      <section className="wrap sec--tight" aria-labelledby="packs-title">
        <SectionHead
          id="packs-title"
          title="Session packs"
          intro="Buy through the desk on WhatsApp and pay by mobile money or card."
        />
        <ul className="check-list mb-10">
          {PACK_BASICS.map((item) => (
            <li key={item}>
              <Check />
              {item}
            </li>
          ))}
        </ul>
        <ol className="rows">
          {PACKS.map((p) => (
            <li className="row" key={p.id} aria-labelledby={`pack-${p.id}`}>
              <span className="row__lead">
                <span className="row__count">{p.sessions.split(" ")[0]}</span>×{" "}
                {p.sessionMinutes} min
              </span>
              <div className="row__main">
                <h3 className="h3" id={`pack-${p.id}`}>
                  {p.name}
                </h3>
                {p.featured && <span className="tag">Most people choose this</span>}
                <p className="small">{p.description}</p>
                <p className="meta">
                  {p.validity}
                  {p.extras.length > 0 && `. Adds ${p.extras.join(" and ").toLowerCase()}.`}
                </p>
              </div>
              <div className="price">
                {p.price}
                <span className="pack-per">
                  <span>{p.perSession}</span>
                  <strong>{p.saving}</strong>
                </span>
              </div>
              <Link
                className={p.featured ? "btn row__cta" : "btn btn--outline row__cta"}
                href={`/contact?subject=pack&pack=${p.id}`}
              >
                {p.cta}
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="surface-stone" aria-label="Gifts and companies">
        <div className="wrap sec offer-grid">
          <article className="offer" id="voucher" aria-labelledby="voucher-title">
            <h2 className="h2" id="voucher-title">
              A gift voucher, for someone who will not book this for themselves.
            </h2>
            <p className="body">{GIFT_VOUCHER.description}</p>
            <div className="stack--tight">
              <span className="meta">Choose an amount</span>
              <div className="offer__amounts">
                {GIFT_VOUCHER.values.map((value) => (
                  <Link
                    key={value}
                    className="chip"
                    href={`/contact?subject=voucher&amount=${value}`}
                  >
                    {formatRWF(value)}
                  </Link>
                ))}
              </div>
            </div>
            <Link className="btn" href="/contact?subject=voucher">
              {GIFT_VOUCHER.cta}
            </Link>
          </article>

          <article className="offer" id="corporate" aria-labelledby="corporate-title">
            <h2 className="h2" id="corporate-title">
              For companies: a staff benefit people actually use.
            </h2>
            <p className="body">{CORPORATE.description}</p>
            <ul className="check-list">
              {CORPORATE.points.map((point) => (
                <li key={point}>
                  <Check />
                  {point}
                </li>
              ))}
            </ul>
            <Link className="btn btn--outline" href="/contact?subject=corporate">
              {CORPORATE.cta}
            </Link>
          </article>
        </div>
      </section>

      <div className="wrap sec">
        <Faq name="packs-faq" items={PACK_FAQS} title="How packs work.">
          <Link className="tlink" href="/sessions">
            Compare single sessions
          </Link>
        </Faq>
      </div>
    </main>
  )
}
