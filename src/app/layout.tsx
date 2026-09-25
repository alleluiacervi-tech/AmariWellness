import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"
import { DM_Sans, DM_Mono, Instrument_Serif } from "next/font/google"
import Nav from "@/components/Nav"
import Footer from "@/components/Footer"
import { getSessionTypes, getSiteConfig, getSocialLinks } from "@/server/db/content"
import { OPEN_GRAPH_BASE, SITE_URL } from "@/lib/metadata"
import "./globals.css"

// Every page reads live site content (prices, hours, the footer's
// address and social links) from the database through this layout —
// see the P1.3 commit message and AGENTS.md. Forcing the whole tree
// dynamic means an admin edit shows up on the next request, not the
// next deploy, and — just as important — means `next build` never
// tries to reach a database that may not exist yet (Phase 0 hasn't
// picked a hosting/DB provider; see the note on `db/client.ts`'s lazy
// connection). Once traffic and a real provider exist, this is the
// place to trade some of that freshness for `unstable_cache` with
// tag-based revalidation from the admin's Server Actions.
export const dynamic = "force-dynamic"

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

// `applicationName`/`TITLE` stay literal — same call as `OPEN_GRAPH_BASE`'s
// hardcoded "Amari Kigali" in src/lib/metadata.ts (used in every page's
// title template). Re-theming the site's own name throughout is a bigger
// change than P1.3 asks for; `locations.name` drives the JSON-LD and the
// footer's legal line below, which is where an admin's rename actually
// needs to show up first.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Amari Kigali",
  },
  description:
    "Private automated massage suites in Kimihurura, Kigali. No therapist, no noise — you close the door yourself. Sessions from 8,000 RWF.",
  applicationName: "Amari",
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [siteConfig, socialLinks, sessions] = await Promise.all([
    getSiteConfig(),
    getSocialLinks(),
    getSessionTypes(),
  ])

  /* Tells search and maps what this place is, where, and when it opens. */
  const prices = sessions.map((s) => s.offPeakNumber).concat(sessions.map((s) => s.priceNumber))
  const { weekday, weekend } = siteConfig.hours.schedule
  const clock = (h: number) => `${String(h).padStart(2, "0")}:00`
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: siteConfig.name,
    description: siteConfig.description,
    url: SITE_URL,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    image: `${SITE_URL}/opengraph-image`,
    priceRange:
      prices.length > 0
        ? `RWF ${Math.min(...prices).toLocaleString("en")}–${Math.max(...prices).toLocaleString("en")}`
        : undefined,
    currenciesAccepted: "RWF",
    paymentAccepted: "Mobile money, Credit card",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: `${siteConfig.address.neighborhood}, ${siteConfig.address.city}`,
      addressCountry: "RW",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: clock(weekday.open),
        closes: clock(weekday.close),
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: clock(weekend.open),
        closes: clock(weekend.close),
      },
    ],
  }

  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmMono.variable} ${instrumentSerif.variable}`}
    >
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Nav siteConfig={siteConfig} />
        {children}
        <Footer siteConfig={siteConfig} socialLinks={socialLinks} />
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
