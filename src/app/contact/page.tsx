import { Suspense } from "react"
import ContactFormFromParams, { ContactForm } from "@/components/ContactForm"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import Hours from "@/components/Hours"
import PageHeader from "@/components/PageHeader"
import { ArrowOut, Chat, Mail, Phone } from "@/components/icons"
import { IMAGES } from "@/data/images"
import { getPackProducts, getSiteConfig } from "@/server/db/content"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Find us & get in touch",
  description:
    "KG 7 Ave, Kimihurura, Kigali. Two minutes from the Kimihurura roundabout, with free parking for eight cars. WhatsApp the desk for a reply within the hour.",
  path: "/contact",
})

export default async function ContactPage() {
  const [siteConfig, packs] = await Promise.all([getSiteConfig(), getPackProducts()])
  const { address, contact, hours } = siteConfig
  const whatsapp = `https://wa.me/${contact.whatsapp ?? ""}`

  return (
    <main id="main-content">
      <PageHeader
        title="Two minutes from the roundabout."
        lead={`${address.street}, just off the ${address.neighborhood} roundabout. ${address.parking}, and the door is right off the road.`}
        media={IMAGES.architecture}
      >
        <Link className="btn" href={address.mapsUrl ?? undefined}>
          Get directions <ArrowOut />
        </Link>
        <Link className="tlink" href={whatsapp}>
          Message the desk on WhatsApp
        </Link>
      </PageHeader>

      <div className="wrap sec--tight contact-grid">
        <div className="info">
          <section className="info__block" aria-labelledby="where-title">
            <h2 className="label" id="where-title">
              Where
            </h2>
            <p className="h4">
              {address.street}, {address.neighborhood}
              <br />
              {address.city}, {address.country}
            </p>
            <p className="meta">
              Plus Code <span className="data">{address.plusCode}</span>
            </p>
            <Link className="tlink" href={address.mapsUrl ?? undefined}>
              Open in Google Maps <ArrowOut />
            </Link>
          </section>

          <section className="info__block" aria-labelledby="hours-title">
            <h2 className="label" id="hours-title">
              Hours
            </h2>
            <OpenStatus schedule={hours.schedule} />
            <Hours schedule={hours.schedule} />
            <p className="meta">
              {hours.note} {hours.walkins}
            </p>
          </section>

          <section className="info__block" aria-labelledby="reach-title">
            <h2 className="label" id="reach-title">
              Reach us
            </h2>
            <div className="info__links">
              <Link href={whatsapp}>
                <Chat className="icon mr-3" /> WhatsApp, the fastest way
              </Link>
              <a href={`tel:${(contact.phone ?? "").replace(/[^0-9+]/g, "")}`}>
                <Phone className="icon mr-3" />
                <span className="font-mono">{contact.phone}</span>
              </a>
              <a href={`mailto:${contact.email ?? ""}`}>
                <Mail className="icon mr-3" />
                <span className="font-mono">{contact.email}</span>
              </a>
            </div>
            <p className="meta">{contact.responseTime}</p>
          </section>
        </div>

        <Suspense fallback={<ContactForm contact={contact} packs={packs} />}>
          <ContactFormFromParams contact={contact} packs={packs} />
        </Suspense>
      </div>
    </main>
  )
}
