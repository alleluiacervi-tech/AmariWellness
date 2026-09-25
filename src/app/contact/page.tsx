import { Suspense } from "react"
import Bloom from "@/components/Bloom"
import ContactFormFromParams, { ContactForm } from "@/components/ContactForm"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import PageHeader from "@/components/PageHeader"
import { ArrowOut, Chat, Mail, Phone } from "@/components/icons"
import { SITE_CONFIG } from "@/data/site"
import { IMAGES } from "@/data/images"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Find us & get in touch",
  description:
    "KG 7 Ave, Kimihurura, Kigali. Two minutes from the Kimihurura roundabout, with free parking for eight cars. WhatsApp the desk for a reply within the hour.",
  path: "/contact",
})

export default function ContactPage() {
  const { address, contact, hours } = SITE_CONFIG
  const whatsapp = `https://wa.me/${contact.whatsapp}`

  return (
    <main id="main-content">
      <PageHeader
        label={`Contact · ${address.neighborhood}`}
        title={
          <>
            Two minutes from <em>the roundabout.</em>
          </>
        }
        lead={`${address.landmark}, on ${address.street}. ${address.parking}.`}
        media={IMAGES.architecture}
      >
        <Link className="btn" href={address.mapsUrl}>
          Get directions <ArrowOut />
        </Link>
        <Link className="tlink" href={whatsapp}>
          WhatsApp the desk <Bloom />
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
            <p className="data">Plus Code · {address.plusCode}</p>
            <Link className="tlink" href={address.mapsUrl}>
              Open in Google Maps <ArrowOut />
            </Link>
          </section>

          <section className="info__block" aria-labelledby="hours-title">
            <h2 className="label" id="hours-title">
              Hours
            </h2>
            <OpenStatus />
            <p className="info__hours">
              {hours.weekdays}
              <br />
              {hours.weekends}
            </p>
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
                <Chat className="icon mr-3" /> WhatsApp · fastest
              </Link>
              <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>
                <Phone className="icon mr-3" /> {contact.phone}
              </a>
              <a href={`mailto:${contact.email}`}>
                <Mail className="icon mr-3" /> {contact.email}
              </a>
            </div>
            <p className="meta">{contact.responseTime}</p>
          </section>
        </div>

        <Suspense fallback={<ContactForm />}>
          <ContactFormFromParams />
        </Suspense>
      </div>
    </main>
  )
}
