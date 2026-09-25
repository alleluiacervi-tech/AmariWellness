"use client"

import { useActionState } from "react"
import { updateLocation, type ActionState } from "@/server/admin/actions"
import type { SiteConfig } from "@/server/db/content"

const initial: ActionState = {}

export default function LocationForm({
  siteConfig,
  operational,
}: {
  siteConfig: SiteConfig
  operational: {
    turnoverMinutes: number
    quietHoursEndHour: number
    cancellationWindowHours: number
    holdMinutes: number
  }
}) {
  const [state, formAction, pending] = useActionState(updateLocation, initial)
  const { name, address, contact, hours } = siteConfig

  return (
    <form className="form-card" action={formAction}>
      <div className="stack--tight">
        <h2 className="h3">Business details</h2>
        <p className="meta">Shown on the contact page, in the footer, and to search engines.</p>
      </div>

      <label className="field">
        <span className="field__label">Name</span>
        <input className="input" name="name" defaultValue={name} required maxLength={80} />
      </label>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Street</span>
          <input className="input" name="street" defaultValue={address.street} required maxLength={120} />
        </label>
        <label className="field">
          <span className="field__label">Neighborhood</span>
          <input className="input" name="neighborhood" defaultValue={address.neighborhood} required maxLength={80} />
        </label>
        <label className="field">
          <span className="field__label">City</span>
          <input className="input" name="city" defaultValue={address.city} required maxLength={80} />
        </label>
        <label className="field">
          <span className="field__label">Country</span>
          <input className="input" name="country" defaultValue={address.country} required maxLength={80} />
        </label>
        <label className="field">
          <span className="field__label">Plus Code</span>
          <input className="input" name="plusCode" defaultValue={address.plusCode ?? ""} maxLength={40} />
        </label>
        <label className="field">
          <span className="field__label">Google Maps link</span>
          <input className="input" name="mapsUrl" type="url" defaultValue={address.mapsUrl ?? ""} maxLength={500} />
        </label>
        <label className="field">
          <span className="field__label">Landmark</span>
          <input className="input" name="landmark" defaultValue={address.landmark ?? ""} maxLength={200} />
        </label>
        <label className="field">
          <span className="field__label">Parking note</span>
          <input className="input" name="parkingNote" defaultValue={address.parking ?? ""} maxLength={200} />
        </label>
      </div>

      <div className="form-grid">
        <label className="field">
          <span className="field__label">Phone</span>
          <input className="input" name="phone" defaultValue={contact.phone ?? ""} maxLength={40} />
        </label>
        <label className="field">
          <span className="field__label">WhatsApp (digits only, for wa.me links)</span>
          <input className="input input--mono" name="whatsapp" defaultValue={contact.whatsapp ?? ""} maxLength={20} />
        </label>
        <label className="field">
          <span className="field__label">Email</span>
          <input className="input" name="email" type="email" defaultValue={contact.email ?? ""} maxLength={120} />
        </label>
      </div>

      <div className="stack--tight">
        <h3 className="h4">Opening hours</h3>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Weekdays open</span>
            <input className="input" name="weekdayOpen" type="time" defaultValue={clock(hours.schedule.weekday.open)} required />
          </label>
          <label className="field">
            <span className="field__label">Weekdays close</span>
            <input className="input" name="weekdayClose" type="time" defaultValue={clock(hours.schedule.weekday.close)} required />
          </label>
          <label className="field">
            <span className="field__label">Weekends open</span>
            <input className="input" name="weekendOpen" type="time" defaultValue={clock(hours.schedule.weekend.open)} required />
          </label>
          <label className="field">
            <span className="field__label">Weekends close</span>
            <input className="input" name="weekendClose" type="time" defaultValue={clock(hours.schedule.weekend.close)} required />
          </label>
        </div>
      </div>

      <div className="stack--tight">
        <h3 className="h4">Booking rules</h3>
        <div className="form-grid">
          <label className="field">
            <span className="field__label">Turnover between guests (minutes)</span>
            <input
              className="input input--mono"
              name="turnoverMinutes"
              type="number"
              min={0}
              max={120}
              defaultValue={operational.turnoverMinutes}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Quiet hours end at (24h)</span>
            <input
              className="input input--mono"
              name="quietHoursEndHour"
              type="number"
              min={0}
              max={23}
              defaultValue={operational.quietHoursEndHour}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Free cancellation window (hours)</span>
            <input
              className="input input--mono"
              name="cancellationWindowHours"
              type="number"
              min={0}
              max={72}
              defaultValue={operational.cancellationWindowHours}
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Unpaid hold expires after (minutes)</span>
            <input
              className="input input--mono"
              name="holdMinutes"
              type="number"
              min={1}
              max={60}
              defaultValue={operational.holdMinutes}
              required
            />
          </label>
        </div>
      </div>

      {state.error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {state.error}
        </p>
      )}
      {state.ok && <p className="small">Saved.</p>}
      <button className="btn" type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save business details"}
      </button>
    </form>
  )
}

function clock(hour: number) {
  return `${String(hour).padStart(2, "0")}:00`
}
