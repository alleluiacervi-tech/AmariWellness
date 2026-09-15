"use client"

/* A checkout should not offer twelve ways to leave it. */

import { usePathname } from "next/navigation"
import Link from "@/components/Link"
import { SITE_CONFIG } from "@/data/site"

const logoSvg = "/amari-horizontal.svg"

const FOOTER_COLUMNS = [
  {
    heading: "The place",
    links: [
      { label: "The space & the shelf", href: "/space" },
      { label: "The chairs & programmes", href: "/sessions" },
      { label: "What actually happens", href: "/#what" },
      { label: "Which session suits me", href: "/#quiz" },
    ],
  },
  {
    heading: "Prices",
    links: [
      { label: "Single sessions", href: "/sessions" },
      { label: "Session packs", href: "/packs" },
      { label: "Gift vouchers", href: "/contact?subject=voucher" },
      { label: "For companies", href: "/contact?subject=corporate" },
    ],
  },
  {
    heading: "Visit",
    links: [
      { label: "Book a chair", href: "/book" },
      { label: "Where we are", href: "/contact" },
      { label: "Opening hours", href: "/contact" },
      { label: "Get in touch", href: "/contact" },
    ],
  },
]

export default function Footer() {
  const { address, contact, hours, payments } = SITE_CONFIG
  const pathname = usePathname()
  if (pathname.startsWith("/book")) {
    return (
      <footer
        className="footer footer--minimal surface-deep"
        role="contentinfo"
      >
        <div className="footer__base">
          <span>
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}, Kigali
          </span>
          <span>
            Questions?{" "}
            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__wa"
            >
              WhatsApp us
            </a>{" "}
            or call {contact.phone}
          </span>
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer surface-deep" role="contentinfo">
      <div className="footer__grid">
        <div>
          <img
            className="footer__lockup"
            src={logoSvg}
            alt={SITE_CONFIG.name}
          />
          <span className="footer__slogan">{SITE_CONFIG.tagline}</span>
          <p className="footer__address">
            {address.street}
            <br />
            {address.neighborhood}, {address.city}
            <br />
            {hours.weekdays}
            <br />
            {hours.weekends}
          </p>
          <p className="footer__contact">
            <a
              href={`https://wa.me/${contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer__wa"
            >
              WhatsApp us
            </a>
            <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
          </p>
        </div>

        {FOOTER_COLUMNS.map(({ heading, links }) => (
          <div key={heading}>
            <h2 className="footer__heading">{heading}</h2>
            <ul className="footer__list">
              {links.map((link) => (
                <li key={link.label}>
                  <Link className="footer__link" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer__pay">
        <span className="footer__pay-label">We accept</span>
        <ul className="footer__pay-list">
          {payments.methods.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>

      <div className="footer__base">
        <span>
          &copy; {new Date().getFullYear()} {SITE_CONFIG.name}, Kigali. All
          rights reserved.
        </span>
        <span>A place to stop.</span>
      </div>
    </footer>
  )
}
