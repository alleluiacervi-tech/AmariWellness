import { describe, expect, it } from "vitest"
import { isKigaliTomorrow, renderBookingMessage, type BookingMessageContext } from "../templates"

// 08:00 UTC = 10:00 in Kigali, a Sunday.
const START = new Date("2027-01-10T08:00:00Z")

const ctx: BookingMessageContext = {
  reference: "AM-1A2B3C4D",
  clientName: "Amani <b>Uwase</b>",
  sessionName: "The Half Hour",
  durationMinutes: 30,
  startAt: START,
  amountPaidRwf: 15000,
  businessName: "Amari Kimihurura",
  address: "KG 7 Ave, Kimihurura, Kigali",
  mapsUrl: "https://maps.example/amari",
  accountUrl: "https://amari.test/account",
  cancellationWindowHours: 4,
  changeableOnline: true,
  whatsappUrl: "https://wa.me/250780000000",
}

describe("renderBookingMessage", () => {
  it("confirms with the Kigali wall time, reference, amount paid and the QR", () => {
    const m = renderBookingMessage("booking_confirmed", ctx)
    expect(m.subject).toBe("Your Amari session is booked: Sunday 10 January, 10:00")
    expect(m.text).toContain("Hello Amani,")
    expect(m.text).toContain("The Half Hour, 30 minutes")
    expect(m.text).toContain("Sunday 10 January at 10:00")
    expect(m.text).toContain("Reference AM-1A2B3C4D")
    expect(m.text).toContain("Paid 15,000 RWF")
    expect(m.text).toContain("free of charge up to 4 hours before: https://amari.test/account")
    expect(m.includesQr).toBe(true)
    expect(m.html).toContain('src="cid:qr"')
  })

  it("points a booking made at reception to the desk, not to an online change it would refuse", () => {
    const m = renderBookingMessage("booking_confirmed", { ...ctx, changeableOnline: false })
    expect(m.text).not.toContain("https://amari.test/account")
    expect(m.text).toContain("Contact us up to 4 hours before: https://wa.me/250780000000")
  })

  it("escapes client-supplied text in the HTML version", () => {
    const m = renderBookingMessage("booking_confirmed", { ...ctx, clientName: "<script>x</script> Guest" })
    expect(m.html).not.toContain("<script>")
    expect(m.html).toContain("&lt;script&gt;")
  })

  it("says tomorrow or today in the 24-hour reminder depending on when it actually goes out, and carries no QR", () => {
    const dayBefore = renderBookingMessage("reminder_24h", { ...ctx, now: new Date("2027-01-09T09:00:00Z") })
    expect(dayBefore.subject).toBe("Tomorrow at 10:00: your Amari session")
    expect(dayBefore.includesQr).toBe(false)
    expect(dayBefore.html).not.toContain("cid:qr")

    const sameDay = renderBookingMessage("reminder_24h", { ...ctx, now: new Date("2027-01-10T05:00:00Z") })
    expect(sameDay.subject).toBe("Today at 10:00: your Amari session")
  })

  it("resends the QR with the 2-hour reminder, the message most likely open at the door", () => {
    const m = renderBookingMessage("reminder_2h", ctx)
    expect(m.includesQr).toBe(true)
    expect(m.subject).toBe("In two hours: your Amari session at 10:00")
  })

  it("explains the outcome of a cancellation: refund, late forfeit, or neither", () => {
    expect(renderBookingMessage("booking_cancelled", { ...ctx, refundedRwf: 15000 }).text).toContain(
      "A refund of 15,000 RWF is on its way",
    )
    expect(renderBookingMessage("booking_cancelled", { ...ctx, lateCancellation: true }).text).toContain(
      "within 4 hours of the start",
    )
    const neutral = renderBookingMessage("booking_cancelled", ctx).text
    expect(neutral).not.toContain("refund")
    expect(neutral).toContain("Book again any time: https://amari.test/book")
  })
})

describe("isKigaliTomorrow", () => {
  it("compares Kigali calendar days, not UTC ones", () => {
    // 23:30 UTC on the 9th is already 01:30 on the 10th in Kigali — so a 10:00 session on the 10th is "today".
    expect(isKigaliTomorrow(START, new Date("2027-01-09T23:30:00Z"))).toBe(false)
    expect(isKigaliTomorrow(START, new Date("2027-01-09T21:30:00Z"))).toBe(true)
  })
})
