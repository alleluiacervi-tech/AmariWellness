import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { deleteHoliday, deleteSocialLink } from "@/server/admin/actions"
import { getHolidays, getLocation, getSiteConfig, getSocialLinks } from "@/server/db/content"
import LocationForm from "./LocationForm"
import HolidayForm from "./HolidayForm"
import SocialLinkForm from "./SocialLinkForm"

export const metadata = {
  title: "Location & hours — Amari workspace",
  robots: { index: false, follow: false },
}

export default async function StaffLocationPage() {
  await requireStaffPage("hours.edit")
  const [siteConfig, location, holidays, socialLinks] = await Promise.all([
    getSiteConfig(),
    getLocation(),
    getHolidays(),
    getSocialLinks(),
  ])

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 720 }}>
        <div className="stack--tight">
          <Link className="tlink" href="/staff">
            ← Workspace
          </Link>
          <p className="label">Location &amp; hours</p>
          <h1 className="h2">Where you are, when you&rsquo;re open, and how to reach you.</h1>
        </div>

        <LocationForm
          siteConfig={siteConfig}
          operational={{
            turnoverMinutes: location.turnoverMinutes,
            quietHoursEndHour: location.quietHoursEndHour,
            cancellationWindowHours: location.cancellationWindowHours,
            holdMinutes: location.holdMinutes,
          }}
        />

        <section className="form-card">
          <div className="stack--tight">
            <h2 className="h3">Holidays &amp; closures</h2>
            <p className="meta">A closed day disappears from the booking calendar automatically.</p>
          </div>
          {holidays.length > 0 && (
            <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {holidays.map((h) => (
                <li key={h.id} className="cluster justify-between">
                  <span className="small">
                    <span className="font-mono">{h.date}</span> — {h.label} {!h.closed && "(altered hours)"}
                  </span>
                  <form action={deleteHoliday.bind(null, h.id)}>
                    <button className="btn btn--outline btn--sm" type="submit">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <HolidayForm />
        </section>

        <section className="form-card">
          <div className="stack--tight">
            <h2 className="h3">Social links</h2>
            <p className="meta">Shown in the footer. WhatsApp and Instagram get their own icon; others show as text.</p>
          </div>
          {socialLinks.length > 0 && (
            <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {socialLinks.map((link) => (
                <li key={link.id} className="cluster justify-between">
                  <span className="small">
                    {link.label} — <span className="meta">{link.url}</span>
                  </span>
                  <form action={deleteSocialLink.bind(null, link.id)}>
                    <button className="btn btn--outline btn--sm" type="submit">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <SocialLinkForm />
        </section>
      </div>
    </main>
  )
}
