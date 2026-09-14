import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Contact & Location',
  description:
    'Find us in Kimihurura, Kigali. WhatsApp, phone, opening hours, parking and the Plus Code for directions.',
}

export default function ContactLayout({ children }: { children: ReactNode }) {
  return children
}
