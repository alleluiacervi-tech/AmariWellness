import type { Metadata } from "next"
import type { ReactNode } from "react"
import { DM_Sans, DM_Mono, Instrument_Serif } from "next/font/google"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-dm-sans",
  display: "swap",
})

/* The machine's voice: durations, prices, times, reference codes. */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

/* The room's voice. Replaces Lora: tighter, larger for the same space,
   and it holds its character at display size. */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Amari — A Chair. A Quiet Room. Time to Think.",
    template: "%s | Amari Kigali",
  },
  description:
    "Private automated massage suites in Kimihurura, Kigali. No therapist, no noise — you close the door yourself. Book online from 8,000 RWF.",
  keywords: [
    "massage chair Kigali",
    "massage Rwanda",
    "wellness Kigali",
    "quiet space Kigali",
    "Kimihurura",
    "zero gravity massage",
    "relaxation Kigali",
  ],
  openGraph: {
    title: "Amari — A Chair. A Quiet Room. Time to Think.",
    description:
      "Private automated massage suites in Kimihurura, Kigali. No therapist, no noise. Book online.",
    locale: "en_RW",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
