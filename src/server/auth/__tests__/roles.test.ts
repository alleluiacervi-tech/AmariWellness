import { describe, expect, it } from "vitest"
import { can } from "../roles"

/**
 * Spot-checks against the exact permission table in CLAUDE.md §3 — the
 * business requirements, not an arbitrary implementation detail. If
 * this test needs to change, the owner's policy changed, not just the
 * code.
 */
describe("role capabilities", () => {
  it("only Owner can edit prices", () => {
    expect(can("owner", "prices.edit")).toBe(true)
    expect(can("manager", "prices.edit")).toBe(false)
    expect(can("front_desk", "prices.edit")).toBe(false)
    expect(can("finance", "prices.edit")).toBe(false)
  })

  it("Front desk can check clients in but not change prices or refund", () => {
    expect(can("front_desk", "bookings.checkIn")).toBe(true)
    expect(can("front_desk", "prices.edit")).toBe(false)
    expect(can("front_desk", "payments.refund")).toBe(false)
  })

  it("Finance can view and export reports and refund, but not edit bookings or content", () => {
    expect(can("finance", "reports.view")).toBe(true)
    expect(can("finance", "reports.export")).toBe(true)
    expect(can("finance", "payments.refund")).toBe(true)
    expect(can("finance", "bookings.create")).toBe(false)
    expect(can("finance", "content.edit")).toBe(false)
  })

  it("Manager can manage bookings, clients, content and promo codes but not staff or full finance", () => {
    expect(can("manager", "bookings.create")).toBe(true)
    expect(can("manager", "clients.edit")).toBe(true)
    expect(can("manager", "content.edit")).toBe(true)
    expect(can("manager", "promoCodes.edit")).toBe(true)
    expect(can("manager", "staff.manage")).toBe(false)
    expect(can("manager", "reports.view")).toBe(false)
  })

  it("only Owner can manage staff and view the activity log", () => {
    for (const role of ["manager", "front_desk", "finance"] as const) {
      expect(can(role, "staff.manage")).toBe(false)
      expect(can(role, "activityLog.view")).toBe(false)
    }
    expect(can("owner", "staff.manage")).toBe(true)
    expect(can("owner", "activityLog.view")).toBe(true)
  })

  it("fails closed (throws) for a capability that doesn't exist, rather than silently granting it", () => {
    // No role ever gets to edit recorded income — that isn't a role
    // check at all, it's enforced by the database trigger in migration
    // 0001, so there is deliberately no "ledger.edit" capability for any
    // role to hold. This simulates a future bug — code elsewhere
    // calling `can()` with a typo'd or made-up capability string — and
    // confirms it errors loudly instead of `undefined.includes(...)`
    // coercing to a false "sure, allowed".
    // @ts-expect-error — deliberately passing a capability that isn't in the table
    expect(() => can("owner", "ledger.edit")).toThrow()
  })
})
