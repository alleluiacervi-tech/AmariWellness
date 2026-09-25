"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Bloom from "@/components/Bloom"
import Link from "@/components/Link"
import OpenStatus from "@/components/OpenStatus"
import { Arrow, Close } from "@/components/icons"
import { SITE_CONFIG } from "@/data/site"

const LOGO = "/amari-horizontal.svg"

const LINKS = [
  { label: "The Space", href: "/space" },
  { label: "Sessions", href: "/sessions" },
  { label: "Packs & gifts", href: "/packs" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
]

const MOBILE_LINKS = [
  { label: "Home", href: "/" },
  ...LINKS,
  { label: "My bookings", href: "/account" },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const closeRef = useRef<HTMLButtonElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const toggle = toggleRef.current
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
      if (e.key !== "Tab") return
      const items = menuRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])",
      )
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      toggle?.focus()
    }
  }, [menuOpen])

  useEffect(() => setMenuOpen(false), [pathname])

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)
  // Already booking: a second "Book" button would only compete with the flow.
  const showCta = !pathname.startsWith("/book")

  return (
    <>
      <nav
        className="nav surface-paper"
        aria-label="Primary"
        data-scrolled={scrolled || undefined}
      >
        <div className="nav__inner">
          <Link className="nav__brand" href="/" aria-label="Amari — home">
            <img className="nav__lockup" src={LOGO} alt="" width={140} height={56} />
          </Link>

          <div className="nav__links">
            {LINKS.map(({ label, href }) => (
              <Link
                key={href}
                className="nav__link"
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
            {showCta && (
              <Link className="btn btn--sm nav__cta" href="/book">
                Book a session
              </Link>
            )}
          </div>

          <div className="nav__actions">
            {showCta && (
              <Link className="btn btn--sm" href="/book">
                Book
              </Link>
            )}
            <button
              ref={toggleRef}
              className="nav__toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div
          ref={menuRef}
          id="site-menu"
          className="menu surface-paper"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="menu__header">
            <Link href="/" aria-label="Amari — home" onClick={() => setMenuOpen(false)}>
              <img className="menu__logo" src={LOGO} alt="" width={115} height={46} />
            </Link>
            <button
              ref={closeRef}
              className="menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <Close />
            </button>
          </div>
          <ul className="menu__list">
            {MOBILE_LINKS.map(({ label, href }) => (
              <li key={href}>
                <Link
                  className="menu__link"
                  href={href}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                  <Bloom />
                </Link>
              </li>
            ))}
          </ul>
          <Link
            className="btn btn--block menu__cta"
            href="/book"
            onClick={() => setMenuOpen(false)}
          >
            Book a session <Arrow />
          </Link>
          <div className="menu__footer">
            <OpenStatus />
            <span>
              {SITE_CONFIG.address.street} · {SITE_CONFIG.address.neighborhood},{" "}
              {SITE_CONFIG.address.city}
            </span>
            <span className="data">{SITE_CONFIG.contact.phone}</span>
          </div>
        </div>
      )}
    </>
  )
}
