import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { getContentBlocks, getFaqsForAdmin } from "@/server/db/content"
import TextBlockForm from "./TextBlockForm"
import JsonBlockForm from "./JsonBlockForm"
import FaqEditForm from "./FaqEditForm"
import AddFaqForm from "./AddFaqForm"

export const metadata = {
  title: "Website text & FAQs — Amari workspace",
  robots: { index: false, follow: false },
}

const TEXT_BLOCKS: { key: string; label: string }[] = [
  { key: "site.tagline", label: "Site tagline" },
  { key: "site.description", label: "Site description" },
  { key: "hours.note", label: "Hours note" },
  { key: "hours.walkins", label: "Walk-ins note" },
  { key: "contact.responseTime", label: "Contact response time" },
  { key: "payments.note", label: "Payments note" },
]

const FAQ_GROUPS: { key: string; label: string }[] = [
  { key: "home", label: "Home" },
  { key: "sessions", label: "Sessions" },
  { key: "space", label: "Space" },
  { key: "packs", label: "Packs" },
]

export default async function StaffContentPage() {
  await requireStaffPage("content.edit")
  const [blocks, faqs] = await Promise.all([getContentBlocks(), getFaqsForAdmin()])

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 720 }}>
        <div className="stack--tight">
          <Link className="tlink" href="/staff">
            ← Workspace
          </Link>
          <p className="label">Website text &amp; FAQs</p>
          <h1 className="h2">What visitors read.</h1>
        </div>

        <section className="form-card">
          <h2 className="h3">Site text</h2>
          <div className="stack">
            {TEXT_BLOCKS.map((b) => (
              <TextBlockForm key={b.key} blockKey={b.key} label={b.label} value={(blocks[b.key] as string) ?? ""} />
            ))}
          </div>
        </section>

        <section className="form-card">
          <h2 className="h3">Structured content</h2>
          <p className="meta">Edited as raw JSON for now — see the field hint below each one for the expected shape.</p>
          <div className="stack">
            <JsonBlockForm
              blockKey="hygiene_protocol"
              label="Hygiene protocol"
              hint='An array of {"label", "detail"} objects.'
              value={blocks["hygiene_protocol"] ?? []}
            />
            <JsonBlockForm
              blockKey="visit_steps"
              label="First-visit steps"
              hint='An array of {"time", "title", "body"} objects.'
              value={blocks["visit_steps"] ?? []}
            />
            <JsonBlockForm
              blockKey="shelf"
              label="Shelf"
              hint='An object: {"note", "titles": [{"title", "author"}]}.'
              value={blocks["shelf"] ?? { note: "", titles: [] }}
            />
          </div>
        </section>

        <section className="form-card">
          <h2 className="h3">FAQs</h2>
          <div className="stack">
            {FAQ_GROUPS.map((group) => {
              const groupFaqs = faqs.filter((f) => f.group === group.key)
              return (
                <div key={group.key} id={`faq-group-${group.key}`} className="stack--tight">
                  <h3 className="h4">{group.label}</h3>
                  {groupFaqs.length > 0 && (
                    <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {groupFaqs.map((faq) => (
                        <FaqEditForm key={faq.id} faq={faq} />
                      ))}
                    </ul>
                  )}
                  <AddFaqForm group={group.key} />
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
