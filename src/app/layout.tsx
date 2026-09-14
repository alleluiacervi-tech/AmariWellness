import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DM_Sans, Lora } from 'next/font/google'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import './globals.css'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Amari — A Chair. A Quiet Room. Time to Think.',
    template: '%s | Amari Kigali',
  },
  description:
    'Private automated massage suites in Kimihurura, Kigali. No therapist, no noise — you close the door yourself. Book online from 8,000 RWF.',
  keywords: [
    'massage chair Kigali',
    'massage Rwanda',
    'wellness Kigali',
    'quiet space Kigali',
    'Kimihurura',
    'zero gravity massage',
    'relaxation Kigali',
  ],
  openGraph: {
    title: 'Amari — A Chair. A Quiet Room. Time to Think.',
    description:
      'Private automated massage suites in Kimihurura, Kigali. No therapist, no noise. Book online.',
    locale: 'en_RW',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${lora.variable}`}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
