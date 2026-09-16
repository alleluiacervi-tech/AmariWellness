"use client"

import { usePathname } from "next/navigation"
import Link from "@/components/Link"
import { SITE_CONFIG } from "@/data/site"

const LOGO = "/amari-horizontal.svg"

const COLUMNS = [
  {
    heading: "The place",
    links: [
      { label: "The space & the shelf", href: "/space" },
      { label: "The chairs & programmes", href: "/sessions" },
      { label: "The journal", href: "/journal" },
      { label: "What actually happens", href: "/#what" },
    ],
  },
  {
    heading: "Prices",
    links: [
      { label: "Single sessions", href: "/sessions" },
      { label: "Session packs", href: "/packs" },
      { label: "Gift vouchers", href: "/packs#voucher" },
      { label: "For companies", href: "/packs#corporate" },
    ],
  },
  {
    heading: "Visit",
    links: [
      { label: "Book a chair", href: "/book" },
      { label: "My bookings", href: "/account" },
      { label: "Where we are", href: "/contact" },
      { label: "Get in touch", href: "/contact" },
    ],
  },
]

export default function Footer() {
  const { address, contact, hours, payments } = SITE_CONFIG
  const pathname = usePathname()

  if (pathname.startsWith("/book")) {
    return (
      <footer className="footer surface-deep" role="contentinfo">
        <div className="wrap">
          <div className="footer__base">
            <span>&copy; {new Date().getFullYear()} {SITE_CONFIG.name}, Kigali</span>
            <span>
              Questions?{" "}
              <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp us
              </a>{" "}
              or call {contact.phone}
            </span>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer surface-deep" role="contentinfo">
      <div className="wrap">
        <div className="footer__grid">
          <div className="stack">
            <img className="footer__lockup" src={LOGO} alt={SITE_CONFIG.name} />
            <span className="quote" style={{ fontSize: 19 }}>{SITE_CONFIG.tagline}</span>
            <p className="data" style={{ lineHeight: 2 }}>
              {address.street}
              <br />
              {address.neighborhood}, {address.city}
              <br />
              {hours.weekdays}
              <br />
              {hours.weekends}
            </p>
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <div key={heading} className="stack">
              <h2 className="label">{heading}</h2>
              <ul className="footer__list">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link className="footer__link" href={l.href}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__base">
          <span className="label">We accept</span>
          <span className="data">{payments.methods.join(" · ").toUpperCase()}</span>
        </div>
        <div className="footer__base">
          <span>&copy; {new Date().getFullYear()} {SITE_CONFIG.name}, Kigali. All rights reserved.</span>
          <span>A place to stop.</span>
        </div>
      </div>
    </footer>
  )
}
