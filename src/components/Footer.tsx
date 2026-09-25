"use client"

import { usePathname } from "next/navigation"
import PaymentMethods from "@/components/PaymentMethods"
import OpenStatus from "@/components/OpenStatus"
import Hours from "@/components/Hours"
import Link from "@/components/Link"
import { SITE_CONFIG } from "@/data/site"

const LOGO = "/amari-horizontal.svg"

const COLUMNS = [
  {
    heading: "The place",
    links: [
      { label: "The space & the shelf", href: "/space" },
      { label: "Between every guest", href: "/space#between-guests" },
      { label: "What actually happens", href: "/#first-visit" },
      { label: "The journal", href: "/journal" },
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
      { label: "Book a session", href: "/book" },
      { label: "My bookings", href: "/account" },
      { label: "Find us", href: "/contact" },
      { label: "Get in touch", href: "/contact#message" },
    ],
  },
]

export default function Footer() {
  const { address, contact } = SITE_CONFIG
  const pathname = usePathname()
  const year = new Date().getFullYear()

  if (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/staff")) return null

  /* Mid-booking, the footer steps back to a single line of help. */
  if (pathname.startsWith("/book")) {
    return (
      <footer className="footer surface-paper">
        <div className="wrap">
          <div className="footer__base">
            <span>
              &copy; {year} {SITE_CONFIG.name}, Kigali
            </span>
            <span>
              Questions?{" "}
              <a
                href={`https://wa.me/${contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp the desk
              </a>{" "}
              or call{" "}
              <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>
                {contact.phone}
              </a>
            </span>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="footer surface-paper">
      <div className="wrap">
        <div className="footer__grid">
          <div className="footer__brand">
            <img
              className="footer__lockup"
              src={LOGO}
              alt={SITE_CONFIG.name}
              width={164}
              height={66}
            />
            <p className="footer__tagline">{SITE_CONFIG.tagline}</p>
            <address className="footer__address">
              {address.street}, {address.neighborhood}
              <br />
              {address.city}, {address.country}
            </address>
            <Hours />
            <OpenStatus />
          </div>

          {COLUMNS.map(({ heading, links }) => (
            <nav key={heading} className="footer__col" aria-label={heading}>
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
            </nav>
          ))}
        </div>

        <div className="footer__base">
          <span className="label">We accept</span>
          <PaymentMethods />
        </div>
        <div className="footer__base">
          <span>
            &copy; {year} {SITE_CONFIG.name}, Kigali. All rights reserved.
          </span>
          <span>A place to stop.</span>
        </div>
      </div>
    </footer>
  )
}
