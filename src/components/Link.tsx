'use client'

import { forwardRef } from 'react'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import NextLink from 'next/link'

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string
  to?: string
  replace?: boolean
  scroll?: boolean
  children?: ReactNode
  className?: string
}

/**
 * Wraps next/link to add a smooth scroll-to-top on non-hash navigations —
 * Next's own `scroll` prop jumps instantly, so it's disabled here except for
 * hash links, where the native scroll-to-element behavior is kept.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, to, scroll = true, replace, onClick, children, ...rest },
  ref,
) {
  const destination = href ?? to ?? '/'
  const isExternal = destination.startsWith('http://') || destination.startsWith('https://') || destination.startsWith('mailto:') || destination.startsWith('tel:')

  if (isExternal) {
    return (
      <a
        ref={ref}
        href={destination}
        target={destination.startsWith('http') ? '_blank' : undefined}
        rel={destination.startsWith('http') ? 'noopener noreferrer' : undefined}
        onClick={onClick}
        {...rest}
      >
        {children}
      </a>
    )
  }

  const isHashLink = destination.includes('#')

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (scroll && !isHashLink) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <NextLink
      ref={ref}
      href={destination}
      replace={replace}
      scroll={isHashLink}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </NextLink>
  )
})

export default Link
