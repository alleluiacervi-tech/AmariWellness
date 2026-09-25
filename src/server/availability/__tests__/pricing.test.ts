import { describe, expect, it } from "vitest"
import { priceForSlot } from "../pricing"

const price = { priceRwf: 15000, offPeakPriceRwf: 12000 }
const location = { quietHoursEndHour: 16 }

// 2027-01-11 is a Monday; 2027-01-10 is a Sunday (weekend).
describe("priceForSlot", () => {
  it("charges the off-peak price on a weekday morning before quietHoursEndHour", () => {
    expect(priceForSlot(price, location, "2027-01-11", 10)).toEqual({ priceRwf: 12000, offPeak: true })
  })

  it("charges the standard price on a weekday at or after quietHoursEndHour", () => {
    expect(priceForSlot(price, location, "2027-01-11", 16)).toEqual({ priceRwf: 15000, offPeak: false })
    expect(priceForSlot(price, location, "2027-01-11", 18)).toEqual({ priceRwf: 15000, offPeak: false })
  })

  it("never applies the off-peak price on a weekend, even in the morning", () => {
    expect(priceForSlot(price, location, "2027-01-10", 10)).toEqual({ priceRwf: 15000, offPeak: false })
  })
})
