"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { SITE_CONFIG } from "@/data/site"

const SUBJECTS = [
  "A booking question",
  "Gift voucher",
  "For companies · request a quote",
  "Something else",
]

function ContactForm() {
  const params = useSearchParams()
  const preset = params.get("subject")
  const initial =
    preset === "voucher" ? SUBJECTS[1] : preset === "corporate" ? SUBJECTS[2] : SUBJECTS[0]

  const [subject, setSubject] = useState(initial)
  const [sent, setSent] = useState(false)

  return (
    <form
      className="surface-dim stack"
      style={{ padding: "clamp(24px, 3vw, 36px)" }}
      onSubmit={(e) => {
        e.preventDefault()
        setSent(true)
      }}
    >
      <p className="label">Send a message</p>
      <label className="field">
        <span>What is it about?</span>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <div className="grid-3" style={{ gap: 14 }}>
        <label className="field">
          <span>Name</span>
          <input type="text" required />
        </label>
        <label className="field field--mono">
          <span>Phone or email</span>
          <input type="text" required />
        </label>
      </div>
      <label className="field">
        <span>Message</span>
        <textarea rows={5} required />
      </label>
      <button className="btn" type="submit" style={{ alignSelf: "flex-start" }}>
        {sent ? "Message sent" : "Send message"}
      </button>
      <p className="meta" style={{ fontSize: 13 }}>
        Or just message us on WhatsApp — it is the fastest way to reach the desk.
      </p>
    </form>
  )
}

export default function ContactPage() {
  const { address, contact, hours } = SITE_CONFIG

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap" style={{ paddingBlock: "clamp(56px, 8vw, 104px) clamp(48px, 6vw, 72px)" }}>
        <p className="label">Contact · {address.neighborhood}</p>
        <h1 className="display" style={{ marginTop: 18, maxWidth: "20ch" }}>
          Two minutes from the roundabout.
        </h1>
      </div>

      <div className="wrap grid-2" style={{ paddingBottom: "clamp(64px, 9vw, 112px)", alignItems: "start" }}>
        <div className="stack" style={{ gap: 28 }}>
          <div className="stack--tight" style={{ borderTop: "1px solid var(--s-rule-2)", paddingTop: 18 }}>
            <span className="label">Where</span>
            <span className="h3" style={{ fontFamily: "var(--font-serif)", fontSize: 25, lineHeight: 1.24 }}>
              {address.street}, {address.neighborhood}
              <br />
              {address.city}, {address.country}
            </span>
            <span className="data" style={{ fontSize: 14 }}>{address.plusCode.toUpperCase()}</span>
            <span className="meta">{address.landmark}. {address.parking}.</span>
          </div>

          <div className="stack--tight" style={{ borderTop: "1px solid var(--s-rule)", paddingTop: 18 }}>
            <span className="label">Hours</span>
            <span className="data" style={{ fontSize: 15, lineHeight: 1.9, color: "var(--s-body)" }}>
              {hours.weekdays}
              <br />
              {hours.weekends}
            </span>
            <span className="meta">{hours.note} {hours.walkins}</span>
          </div>

          <div className="stack--tight" style={{ borderTop: "1px solid var(--s-rule)", paddingTop: 18 }}>
            <span className="label">Reach us</span>
            <a className="data" style={{ fontSize: 15 }} href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer">
              WHATSAPP US
            </a>
            <a className="data" style={{ fontSize: 15 }} href={`tel:${contact.phone.replace(/[^0-9+]/g, "")}`}>
              {contact.phone}
            </a>
            <a className="data" style={{ fontSize: 15 }} href={`mailto:${contact.email}`}>
              {contact.email.toUpperCase()}
            </a>
            <span className="meta">{contact.responseTime}</span>
          </div>
        </div>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </main>
  )
}
