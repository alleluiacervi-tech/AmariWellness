"use client" /* ── FASTEST WAYS ── */ /* ── FORM ── */ /* appearance:none strips the native arrow, so the wrapper
                  draws one back — without it this read as a text field. */

import { useState, useEffect, Suspense } from "react"
import Link from "@/components/Link"
import Reveal from "@/components/Reveal"
import LocationCard from "@/components/LocationCard"
import { useSearchParams } from "next/navigation"
import { SITE_CONFIG } from "@/data/site"

const SUBJECTS = [
  { id: "general", label: "General question" },
  { id: "booking", label: "About a booking" },
  { id: "voucher", label: "Gift voucher" },
  { id: "corporate", label: "For a company" },
  { id: "health", label: "Health question before booking" },
]

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactPageContent />
    </Suspense>
  )
}

function ContactPageContent() {
  const searchParams = useSearchParams()
  const initialSubject = searchParams.get("subject") || "general"

  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "general",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (SUBJECTS.some((s) => s.id === initialSubject)) {
      setForm((f) => ({ ...f, subject: initialSubject }))
    }
  }, [initialSubject])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Please tell us your name."
    if (!form.phone.trim() && !form.email.trim()) {
      e.phone = "Leave a phone number or an email so we can reply."
    }
    if (!form.message.trim()) e.message = "Let us know what you need."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (validate()) setSent(true)
  }

  return (
    <main className="surface-paper" id="main-content">
      <div className="page-intro">
        <Reveal className="page-intro__inner">
          <p className="label">Get in touch</p>
          <h1 className="page-title">Ask us anything.</h1>
          <p className="page-sub">
            Questions about whether the chair suits you, gift vouchers, company
            bookings, or anything else. {SITE_CONFIG.contact.responseTime}
          </p>
        </Reveal>
      </div>

      {}
      <section className="reach" aria-label="Ways to reach us">
        <a
          className="reach__card reach__card--primary"
          href={`https://wa.me/${SITE_CONFIG.contact.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="reach__label">Fastest</span>
          <span className="reach__value">WhatsApp</span>
          <span className="reach__hint">Usually answered within the hour</span>
        </a>
        <a
          className="reach__card"
          href={`tel:${SITE_CONFIG.contact.phone.replace(/[^0-9+]/g, "")}`}
        >
          <span className="reach__label">Call</span>
          <span className="reach__value">{SITE_CONFIG.contact.phone}</span>
          <span className="reach__hint">During opening hours</span>
        </a>
        <a className="reach__card" href={`mailto:${SITE_CONFIG.contact.email}`}>
          <span className="reach__label">Email</span>
          <span className="reach__value">{SITE_CONFIG.contact.email}</span>
          <span className="reach__hint">Within one working day</span>
        </a>
      </section>

      {}
      <section className="contact-form-wrap" aria-label="Send a message">
        {sent ? (
          <div className="contact-sent" role="status" aria-live="polite">
            <p className="label">Sent</p>
            <h2 className="contact-sent__title">Thank you, {form.name}.</h2>
            <p className="contact-sent__body">
              We have your message and will come back to you
              {form.phone ? ` on ${form.phone}` : ` at ${form.email}`}. If it is
              urgent, WhatsApp is always quicker than this form.
            </p>
            <button
              type="button"
              className="tlink"
              style={{ marginTop: "20px" }}
              onClick={() => {
                setSent(false)
                setForm({
                  name: "",
                  phone: "",
                  email: "",
                  subject: "general",
                  message: "",
                })
              }}
            >
              Send another
              <span className="tlink__arrow" aria-hidden="true">
                &rarr;
              </span>
            </button>
          </div>
        ) : (
          <form
            className="contact-form"
            onSubmit={submit}
            noValidate
            aria-label="Contact form"
          >
            <div className="field">
              <label className="field__label" htmlFor="c-name">
                Name <span aria-hidden="true">*</span>
              </label>
              <input
                id="c-name"
                name="name"
                className={`field__input${
                  errors.name ? " field__input--error" : ""
                }`}
                type="text"
                required
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "c-name-err" : undefined}
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              {errors.name && (
                <span id="c-name-err" className="field__error" role="alert">
                  {errors.name}
                </span>
              )}
            </div>

            <div className="field-row">
              <div className="field">
                <label className="field__label" htmlFor="c-phone">
                  Phone
                </label>
                <input
                  id="c-phone"
                  name="phone"
                  className={`field__input${
                    errors.phone ? " field__input--error" : ""
                  }`}
                  type="tel"
                  autoComplete="tel"
                  placeholder="+250 7.."
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "c-phone-err" : undefined}
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
                {errors.phone && (
                  <span id="c-phone-err" className="field__error" role="alert">
                    {errors.phone}
                  </span>
                )}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="c-email">
                  Email
                </label>
                <input
                  id="c-email"
                  name="email"
                  className="field__input"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="c-subject">
                What is it about
              </label>
              {}
              <span className="field__select-wrap">
                <select
                  id="c-subject"
                  name="subject"
                  className="field__input"
                  value={form.subject}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, subject: e.target.value }))
                  }
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </span>
            </div>

            <div className="field">
              <label className="field__label" htmlFor="c-message">
                Message <span aria-hidden="true">*</span>
              </label>
              <textarea
                id="c-message"
                name="message"
                className={`field__input field__textarea${
                  errors.message ? " field__input--error" : ""
                }`}
                rows={5}
                required
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "c-message-err" : undefined}
                value={form.message}
                onChange={(e) =>
                  setForm((f) => ({ ...f, message: e.target.value }))
                }
              />
              {errors.message && (
                <span id="c-message-err" className="field__error" role="alert">
                  {errors.message}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn--solid"
              style={{ alignSelf: "flex-start" }}
            >
              Send message
            </button>
          </form>
        )}

        <aside className="contact-aside">
          <div className="contact-block">
            <h2 className="contact-block__label">Opening hours</h2>
            <p className="contact-block__text">
              {SITE_CONFIG.hours.weekdays}
              <br />
              {SITE_CONFIG.hours.weekends}
              <br />
              {SITE_CONFIG.hours.note}
            </p>
          </div>

          <div className="contact-block">
            <h2 className="contact-block__label">Walking in</h2>
            <p className="contact-block__text">{SITE_CONFIG.hours.walkins}</p>
          </div>

          <div className="contact-block">
            <h2 className="contact-block__label">Booking</h2>
            <p className="contact-block__text">
              Suites are booked online and paid for when you book.
            </p>
            <div style={{ marginTop: "14px" }}>
              <Link className="tlink" href="/book">
                Book a chair
                <span className="tlink__arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>

          <div className="contact-block">
            <h2 className="contact-block__label">Before you book</h2>
            <p className="contact-block__text">
              If you are pregnant, recovering from surgery, or have a spinal
              condition, message us first. We would rather talk it through than
              take a booking you should not have.
            </p>
          </div>
        </aside>
      </section>

      <LocationCard />
    </main>
  )
}
