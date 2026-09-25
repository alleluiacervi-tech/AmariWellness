import type { StaffRole } from "../db/schema"

/**
 * The permission matrix from CLAUDE.md §3. One named capability per row
 * of that table, each mapped to the roles allowed to do it. Nothing
 * checks a role string directly anywhere else in the app — every
 * authorization decision goes through `can()` below, so this file is
 * the single place that answers "who can do X" and the single place
 * that changes if the owner's policy changes.
 *
 * The one capability that appears in no row at all — editing or
 * deleting recorded income — is deliberate: CLAUDE.md §3 says nobody
 * can, including the Owner, and that's enforced a second time (the
 * real enforcement) by the database trigger in migration 0001. This
 * file existing is what keeps the UI from ever offering the action in
 * the first place; the trigger is what stops it if this file is ever
 * wrong.
 */
const CAPABILITIES = {
  "prices.edit": ["owner"],
  "hours.edit": ["owner"],
  "suites.edit": ["owner", "manager"],
  "suites.maintenance": ["owner", "manager", "front_desk"],
  "content.edit": ["owner", "manager"],
  "packs.edit": ["owner"],
  "vouchers.edit": ["owner", "manager"],
  "promoCodes.edit": ["owner", "manager"],
  "company.edit": ["owner", "manager"],
  "bookings.view": ["owner", "manager", "front_desk", "finance"],
  "bookings.create": ["owner", "manager", "front_desk"],
  "bookings.cancel": ["owner", "manager", "front_desk"],
  "bookings.checkIn": ["owner", "manager", "front_desk"],
  "clients.view": ["owner", "manager", "front_desk", "finance"],
  "clients.edit": ["owner", "manager", "front_desk"],
  "messages.view": ["owner", "manager", "front_desk"],
  "messages.reply": ["owner", "manager", "front_desk"],
  "payments.view": ["owner", "manager", "finance"],
  "payments.refund": ["owner", "finance"],
  "discounts.apply": ["owner", "manager"],
  "reports.view": ["owner", "finance"],
  "reports.export": ["owner", "finance"],
  "invoices.manage": ["owner", "finance"],
  "staff.manage": ["owner"],
  "activityLog.view": ["owner"],
  "settings.edit": ["owner"],
} as const satisfies Record<string, readonly StaffRole[]>

export type Capability = keyof typeof CAPABILITIES

export function can(role: StaffRole, capability: Capability): boolean {
  return (CAPABILITIES[capability] as readonly StaffRole[]).includes(role)
}

export function rolesFor(capability: Capability): readonly StaffRole[] {
  return CAPABILITIES[capability]
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: "Owner",
  manager: "Manager",
  front_desk: "Front desk",
  finance: "Finance",
}
