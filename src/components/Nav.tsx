'use client'

import { useEffect, useState, useRef } from 'react'
import Link from '@/components/Link'
import { usePathname } from 'next/navigation'
import { SITE_CONFIG } from '@/data/site'

const logoSvg = '/amari-horizontal.svg'

const NAV_LINKS = [
  { label: 'The Space', href: '/space' },
  { label: 'The Chairs', href: '/sessions' },
  { label: 'Packs', href: '/packs' },
  { label: 'Contact', href: '/contact' },
  { label: 'Book', href: '/book', isPrimary: true },
]

const ALL_MOBILE_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'The Space', href: '/space' },
  { label: 'The Chairs & Programmes', href: '/sessions' },
  { label: 'Session Packs', href: '/packs' },
  { label: 'Contact & Location', href: '/contact' },
  { label: 'Book a Session', href: '/book', isPrimary: true },
]

export default function Nav() {
  const [pinned, setPinned] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (isHome) {
        setPinned(y > window.innerHeight * 0.75)
      } else {
        setPinned(true)
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  useEffect(() => {
    if (!menuOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Focus close button on open
    setTimeout(() => closeBtnRef.current?.focus(), 50)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <nav className={`nav${pinned ? ' nav--pinned' : ''}`}>
        <Link className="nav__brand" href="/" aria-label="Amari Wellness Homepage">
          <img className="nav__lockup" src={logoSvg} alt="Amari Wellness" />
        </Link>

        <div className="nav__links">
          {NAV_LINKS.map(({ label, href, isPrimary }) => (
            <Link
              key={label}
              className={`nav__link${isPrimary ? ' nav__link--cta' : ''}`}
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          className="nav__toggle"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          aria-expanded={menuOpen}
        >
          <span />
          <span />
        </button>
      </nav>

      {menuOpen && (
        <div
          className="menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div className="menu__header">
            <Link href="/" onClick={() => setMenuOpen(false)}>
              <img className="menu__logo" src={logoSvg} alt="Amari Wellness" style={{ height: '32px' }} />
            </Link>
            <button
              ref={closeBtnRef}
              className="menu__close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <ul className="menu__list">
            {ALL_MOBILE_LINKS.map(({ label, href, isPrimary }) => (
              <li key={label}>
                <Link
                  className={`menu__link${isPrimary ? ' menu__link--highlight' : ''}`}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={isActive(href) ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="menu__footer">
            <p className="menu__slogan">{SITE_CONFIG.tagline}</p>
            <p className="menu__contact-info">
              {SITE_CONFIG.address.street} · {SITE_CONFIG.address.neighborhood}, {SITE_CONFIG.address.city}
              <br />
              {SITE_CONFIG.hours.weekdays}
              <br />
              <a
                href={`https://wa.me/${SITE_CONFIG.contact.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--ink)' }}
              >
                WhatsApp us
              </a>
              {' · '}
              <a href={`tel:${SITE_CONFIG.contact.phone.replace(/[^0-9+]/g, '')}`} style={{ color: 'var(--ink)' }}>
                {SITE_CONFIG.contact.phone}
              </a>
            </p>
          </div>
        </div>
      )}
    </>
  )
}
