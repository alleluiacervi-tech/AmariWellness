"use client"

/**
 * No backend, and no pretending there is one: the form composes the
 * message and hands it to WhatsApp or the mail app, already written.
 * Links elsewhere on the site preset the subject (and a draft) through
 * ?subject=voucher&amount=25000, ?subject=pack&pack=ten-half, etc.
 */

import { useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { Mail } from "@/components/icons"
import { SITE_CONFIG } from "@/data/site"
import { PACKS } from "@/data/packs"
import { formatRWF } from "@/data/sessions"

const SUBJECTS = {
  booking: "A booking question",
  pack: "Buying a session pack",
  voucher: "A gift voucher",
  corporate: "A quote for a company",
  other: "Something else",
} as const
type SubjectKey = keyof typeof SUBJECTS

function draftFor(subject: SubjectKey, params: URLSearchParams | null) {
  if (subject === "pack") {
    const pack = PACKS.find((p) => p.id === params?.get("pack"))
    return pack ? `I'd like to buy the ${pack.name} pack (${pack.price}).` : ""
  }
  if (subject === "voucher") {
    const amount = Number(params?.get("amount"))
    return amount > 0
      ? `I'd like to buy a gift voucher for ${formatRWF(amount)}.`
      : ""
  }
  if (subject === "corporate")
    return "We are a team of about __ people, and would like sessions roughly __ times a month."
  return ""
}

export function ContactForm({
  initialSubject = "booking",
  initialMessage = "",
}: {
  initialSubject?: SubjectKey
  initialMessage?: string
}) {
  const [subject, setSubject] = useState<SubjectKey>(initialSubject)
  const [message, setMessage] = useState(initialMessage)
  const [sentVia, setSentVia] = useState<"whatsapp" | "email" | null>(null)
  const { contact } = SITE_CONFIG

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const via =
      (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ===
      "email"
        ? "email"
        : "whatsapp"
    const name = String(form.get("name") ?? "").trim()
    const reply = String(form.get("reply") ?? "").trim()
    const text = `${SUBJECTS[subject]}\n\n${message.trim()}\n\n— ${name}${reply ? ` (${reply})` : ""}`

    if (via === "email") {
      window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent(
        `${SUBJECTS[subject]} — ${name}`,
      )}&body=${encodeURIComponent(text)}`
    } else {
      window.open(
        `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      )
    }
    setSentVia(via)
  }

  return (
    <form className="form-card" id="message" onSubmit={onSubmit}>
      <div className="stack--tight">
        <h2 className="h3">Ask us anything.</h2>
        <p className="meta">
          Nothing is stored here — your message opens in WhatsApp or your mail
          app, ready to send.
        </p>
      </div>

      <label className="field">
        <span className="field__label">What is it about?</span>
        <span className="select">
          <select
            className="input"
            name="subject"
            value={subject}
            onChange={(e) => {
              const next = e.target.value as SubjectKey
              setSubject(next)
              if (!message.trim()) setMessage(draftFor(next, null))
            }}
          >
            {Object.entries(SUBJECTS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </span>
      </label>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Your name</span>
          <input
            className="input"
            name="name"
            autoComplete="name"
            required
            maxLength={80}
          />
        </label>
        <label className="field">
          <span className="field__label">Phone or email</span>
          <input
            className="input input--mono"
            name="reply"
            autoComplete="tel"
            maxLength={120}
          />
          <span className="field__hint">Optional — so we can reply elsewhere.</span>
        </label>
      </div>

      <label className="field">
        <span className="field__label">Message</span>
        <textarea
          className="input"
          name="message"
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>

      <div className="form-actions">
        <button className="btn" type="submit" name="via" value="whatsapp">
          Send on WhatsApp
        </button>
        <button className="btn btn--outline" type="submit" name="via" value="email">
          <Mail className="icon" /> Send by email
        </button>
      </div>

      <p className="meta" role="status" aria-live="polite">
        {sentVia === "whatsapp" &&
          "WhatsApp should have opened in a new tab with your message written out. Press send there and the desk will reply within the hour."}
        {sentVia === "email" &&
          "Your mail app should have opened with the message written out. We reply to email within one working day."}
      </p>
    </form>
  )
}

/** Reads the preset from the URL. Render inside <Suspense> with <ContactForm /> as the fallback. */
export default function ContactFormFromParams() {
  const params = useSearchParams()
  const key = params.get("subject")
  const subject: SubjectKey =
    key && key in SUBJECTS ? (key as SubjectKey) : "booking"
  return (
    <ContactForm
      key={params.toString()}
      initialSubject={subject}
      initialMessage={draftFor(subject, params)}
    />
  )
}
