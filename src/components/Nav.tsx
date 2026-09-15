"use client"

/* Pages that open on a dark full-bleed surface mark themselves with
   data-dark-top. The nav floats over those until it pins, switching
   its whole surface token set rather than just a text colour — which
   is what previously left ink-coloured links on a dark panel. Reading
   the page rather than a route list means a new dark page can never
   be forgotten here. */
/* Pin once the dark surface has mostly scrolled past, so the
         nav never sits half on one ground and half on the other. */ /* Booking is the whole point — it should never require
              opening a menu first. */

import { useEffect, useState, useRef } from "react"
import Link from "@/components/Link"
import { usePathname } from "next/navigation"
import { SITE_CONFIG } from "@/data/site"

const logoSvg = "/amari-horizontal.svg"

const NAV_LINKS = [
  { label: "The Space", href: "/space" },
  { label: "The Chairs", href: "/sessions" },
  { label: "Packs", href: "/packs" },
  { label: "Contact", href: "/contact" },
]

const ALL_MOBILE_LINKS = [
  { label: "Home", href: "/" },
  { label: "The Space", href: "/space" },
  { label: "The Chairs", href: "/sessions" },
  { label: "Session Packs", href: "/packs" },
  { label: "Contact", href: "/contact" },
  { label: "Book a chair", href: "/book", isPrimary: true },
]

export default function Nav() {
  const [pinned, setPinned] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const darkTop = document.querySelector<HTMLElement>("[data-dark-top]")

    const onScroll = () => {
      if (!darkTop) {
        setPinned(true)
        return
      }
      const bottom = darkTop.getBoundingClientRect().bottom
      setPinned(bottom < 120)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const t = setTimeout(() => closeBtnRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
      window.removeEventListener("keydown", onKey)
    }
  }, [menuOpen])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <>
      <nav
        className={`nav ${pinned ? "nav--pinned" : "nav--over"}`}
        aria-label="Primary"
      >
        <Link className="nav__brand" href="/" aria-label="Amari — home">
          <img className="nav__lockup" src={logoSvg} alt="Amari" />
        </Link>

        <div className="nav__links">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              className="nav__link"
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
          <Link
            className="nav__link nav__link--cta"
            href="/book"
            aria-current={isActive("/book") ? "page" : undefined}
          >
            Book
          </Link>
        </div>

        <div className="nav__actions">
          {}
          <Link className="nav__book-mobile" href="/book">
            Book
          </Link>
          <button
            className="nav__toggle"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          className="menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="menu__header">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              aria-label="Amari — home"
            >
              <img className="menu__logo" src={logoSvg} alt="Amari" />
            </Link>
            <button
              ref={closeBtnRef}
              className="menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              &times;
            </button>
          </div>

          <ul className="menu__list">
            {ALL_MOBILE_LINKS.map(({ label, href, isPrimary }) => (
              <li key={label}>
                <Link
                  className={`menu__link${
                    isPrimary ? " menu__link--highlight" : ""
                  }`}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(href) ? "page" : undefined}
                >
                  {label}
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="menu__footer">
            <p className="menu__slogan">{SITE_CONFIG.tagline}</p>
            <p className="menu__contact-info">
              {SITE_CONFIG.address.street} &middot;{" "}
              {SITE_CONFIG.address.neighborhood}, {SITE_CONFIG.address.city}
              <br />
              {SITE_CONFIG.hours.weekdays}
              <br />
              <a
                href={`https://wa.me/${SITE_CONFIG.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp us
              </a>
              {" · "}
              <a
                href={`tel:${SITE_CONFIG.contact.phone.replace(/[^0-9+]/g, "")}`}
              >
                {SITE_CONFIG.contact.phone}
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
