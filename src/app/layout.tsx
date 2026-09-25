import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { DM_Sans, DM_Mono, Instrument_Serif } from "next/font/google"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { SITE_CONFIG } from "@/data/site"
import { SESSIONS } from "@/data/sessions"
import { OPEN_GRAPH_BASE } from "@/lib/metadata"
import "./globals.css"

/* You speak. Variable, with the optical-size axis, so 11px labels and
   20px leads each get the cut drawn for their size. */
const dmSans = DM_Sans({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-dm-sans",
  display: "swap",
})

/* The machine speaks: durations, prices, times, reference codes. */
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
})

/* The room speaks: headlines, names, quotes. */
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
})

const TITLE = "Amari — A chair. A quiet room. Time to think."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: TITLE,
    template: "%s | Amari Kigali",
  },
  description:
    "Private automated massage suites in Kimihurura, Kigali. No therapist, no noise — you close the door yourself. Sessions from 8,000 RWF.",
  applicationName: SITE_CONFIG.name,
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
    ...OPEN_GRAPH_BASE,
    title: TITLE,
    description:
      "Private automated massage suites in Kimihurura, Kigali. A little time. Entirely yours.",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: "#faf8f4",
  colorScheme: "light",
}

/* Tells search and maps what this place is, where, and when it opens. */
const prices = SESSIONS.map((s) => s.offPeakNumber).concat(
  SESSIONS.map((s) => s.priceNumber),
)
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  name: SITE_CONFIG.name,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.url,
  telephone: SITE_CONFIG.contact.phone,
  email: SITE_CONFIG.contact.email,
  image: `${SITE_CONFIG.url}/opengraph-image`,
  priceRange: `RWF ${Math.min(...prices).toLocaleString("en")}–${Math.max(...prices).toLocaleString("en")}`,
  currenciesAccepted: "RWF",
  paymentAccepted: "Mobile money, Credit card",
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_CONFIG.address.street,
    addressLocality: `${SITE_CONFIG.address.neighborhood}, ${SITE_CONFIG.address.city}`,
    addressCountry: "RW",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "09:00",
      closes: "20:00",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  )
}
