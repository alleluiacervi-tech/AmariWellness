"use client"

import Bloom from "@/components/Bloom"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "@/components/Link"
import { SITE_CONFIG } from "@/data/site"

const LOGO = "/amari-horizontal.svg"

const LINKS = [
  { label: "The Space", href: "/space" },
  { label: "Sessions", href: "/sessions" },
  { label: "Packs", href: "/packs" },
  { label: "Journal", href: "/journal" },
  { label: "Contact", href: "/contact" },
]

const MOBILE_LINKS = [
  { label: "Home", href: "/" },
  ...LINKS,
  { label: "My bookings", href: "/account" },
  { label: "Book a session", href: "/book" },
]

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const closeRef = useRef<HTMLButtonElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const t = setTimeout(() => closeRef.current?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
      if (e.key === "Tab") {
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
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
      toggleRef.current?.focus()
    }
  }, [menuOpen])

  useEffect(() => setMenuOpen(false), [pathname])

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null

  return (
    <>
      <nav className="nav surface-paper" aria-label="Primary">
        <div className="nav__inner">
          <Link className="nav__brand" href="/" aria-label="Amari — home">
            <img className="nav__lockup" src={LOGO} alt="Amari" />
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
            <Link className="nav__cta" href="/book">
              Book a session
            </Link>
          </div>

          <div className="nav__actions">
            <Link className="nav__cta" href="/book">
              Book
            </Link>
            <button
              ref={toggleRef}
              className="nav__toggle"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
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
          className="menu surface-paper"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div className="menu__header">
            <Link
              href="/"
              aria-label="Amari — home"
              onClick={() => setMenuOpen(false)}
            >
              <img className="menu__logo" src={LOGO} alt="Amari" />
            </Link>
            <button
              ref={closeRef}
              className="menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              &times;
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
          <div className="menu__footer">
            {SITE_CONFIG.address.street} · {SITE_CONFIG.address.neighborhood} ·{" "}
            {SITE_CONFIG.address.plusCode}
            <br />
            {SITE_CONFIG.hours.weekdays}
            <br />
            {SITE_CONFIG.contact.phone}
          </div>
        </div>
      )}
    </>
  )
}
