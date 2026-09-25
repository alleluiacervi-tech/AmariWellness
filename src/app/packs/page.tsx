import Bloom from "@/components/Bloom"
import Faq from "@/components/Faq"
import Link from "@/components/Link"
import PageHeader from "@/components/PageHeader"
import Reveal from "@/components/Reveal"
import SectionHead from "@/components/SectionHead"
import { Arrow, Check } from "@/components/icons"
import { CORPORATE, GIFT_VOUCHER, PACKS } from "@/data/packs"
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
        surface="surface-stone"
        label="Packs · Vouchers · Companies"
        title={
          <>
            Pay once. <em>Come back whenever you like.</em>
          </>
        }
        lead="No monthly charge, no card on file, no subscription to cancel. Your balance sits against your phone number and comes off when you book."
      />

      <section className="wrap sec" aria-labelledby="packs-title">
        <SectionHead
          id="packs-title"
          label="Session packs"
          title={
            <>
              Prepaid, shareable, <em>never recurring.</em>
            </>
          }
          intro="Buy through the desk on WhatsApp and pay by mobile money or card. Bring whoever you like — the balance is yours, not a named guest's."
        />
        <Reveal className="pack-grid" stagger>
          {PACKS.map((p) => (
            <article
              key={p.id}
              className={p.featured ? "pack pack--featured" : "pack"}
              aria-labelledby={`pack-${p.id}`}
            >
              <div className="pack__head">
                <span className="label">{p.validity}</span>
                {p.featured && <span className="tag">Most people choose this</span>}
              </div>
              <h3 className="h3" id={`pack-${p.id}`}>
                {p.name}
              </h3>
              <div className="pack__price">
                <p className="price">{p.price}</p>
                <p className="pack__per">
                  <span>{p.perSession}</span>
                  <strong>{p.saving}</strong>
                </p>
              </div>
              <p className="small">{p.description}</p>
              <ul className="check-list">
                {p.includes.map((item) => (
                  <li key={item}>
                    <Check />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                className={p.featured ? "btn btn--block" : "btn btn--outline btn--block"}
                href={`/contact?subject=pack&pack=${p.id}`}
              >
                {p.cta} <Arrow />
              </Link>
            </article>
          ))}
        </Reveal>
      </section>

      <section className="surface-dim" aria-label="Gifts and companies">
        <div className="wrap sec offer-grid">
          <article className="offer" id="voucher" aria-labelledby="voucher-title">
            <p className="label">{GIFT_VOUCHER.name}</p>
            <h2 className="h2" id="voucher-title">
              For someone who will not book this <em>for themselves.</em>
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
              {GIFT_VOUCHER.cta} <Arrow />
            </Link>
          </article>

          <article className="offer" id="corporate" aria-labelledby="corporate-title">
            <p className="label">{CORPORATE.name}</p>
            <h2 className="h2" id="corporate-title">
              A staff benefit <em>people actually use.</em>
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
              {CORPORATE.cta} <Arrow />
            </Link>
          </article>
        </div>
      </section>

      <div className="wrap sec">
        <Faq
          name="packs-faq"
          items={PACK_FAQS}
          label="How packs work"
          title={
            <>
              The small print, <em>in plain words.</em>
            </>
          }
        >
          <Link className="tlink" href="/sessions">
            Compare single sessions <Bloom />
          </Link>
        </Faq>
      </div>
    </main>
  )
}
