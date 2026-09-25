"use client"

import { usePathname } from "next/navigation"
import PaymentMethods from "@/components/PaymentMethods"
import OpenStatus from "@/components/OpenStatus"
import Hours from "@/components/Hours"
import Link from "@/components/Link"
import { Instagram, WhatsApp } from "@/components/icons"
import type { SiteConfig, SocialLink } from "@/server/db/content"

const LOGO = "/amari-horizontal.svg"

const SOCIAL_ICONS: Record<string, typeof WhatsApp> = {
  whatsapp: WhatsApp,
  instagram: Instagram,
}

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

export default function Footer({
  siteConfig,
  socialLinks,
}: {
  siteConfig: SiteConfig
  socialLinks: SocialLink[]
}) {
  const { name, tagline, address, contact, hours } = siteConfig
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
              &copy; {year} {name}, Kigali
            </span>
            <span>
              Questions?{" "}
              {contact.whatsapp && (
                <>
                  <a
                    href={`https://wa.me/${contact.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp the desk
                  </a>{" "}
                  or call{" "}
                </>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>{contact.phone}</a>
              )}
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
              alt={name}
              width={164}
              height={66}
            />
            <p className="footer__tagline">{tagline}</p>
            <address className="footer__address">
              {address.street}, {address.neighborhood}
              <br />
              {address.city}, {address.country}
            </address>
            <Hours schedule={hours.schedule} />
            <OpenStatus schedule={hours.schedule} />
            {socialLinks.length > 0 && (
              <ul className="footer__social" aria-label="Follow us">
                {socialLinks.map((link) => {
                  const Icon = SOCIAL_ICONS[link.platform]
                  return (
                    <li key={link.platform}>
                      <a href={link.url} target="_blank" rel="noopener noreferrer">
                        {Icon && <Icon />}
                        {link.label}
                      </a>
                    </li>
                  )
                })}
              </ul>
            )}
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
            &copy; {year} {name}, Kigali. All rights reserved.
          </span>
          <span>A place to stop.</span>
        </div>
      </div>
    </footer>
  )
}
