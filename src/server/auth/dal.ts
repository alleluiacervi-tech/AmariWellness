import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { readSessionState, type SessionState, type StaffSummary } from "./session"
import { can, type Capability } from "./roles"

/**
 * Memoized per request (React's `cache()`) so ten components asking
 * "who's signed in?" during one render cost one database query, not
 * ten — the pattern the Next.js authentication guide's Data Access
 * Layer section recommends.
 */
export const getSessionState = cache(readSessionState)

/** For a Server Component/page: redirects to sign-in if not fully authenticated (a session that still needs its two-step code counts as not authenticated). Optionally also requires a capability, redirecting to the staff home with an error flag if the role doesn't have it. */
export async function requireStaffPage(capability?: Capability): Promise<StaffSummary> {
  const state = await getSessionState()
  if (state.status !== "authenticated") redirect("/staff/login")
  if (capability && !can(state.staff.role, capability)) redirect("/staff?forbidden=1")
  return state.staff
}

/** For a Server Action: throws instead of redirecting, since an action's caller (a form) needs to handle the failure itself rather than being navigated away mid-submission. Every action must call this itself — a page-level redirect does not protect the actions it renders (see docs/database.md and the Next.js data-security guide: "a page-level check does not extend to Server Actions"). */
export async function requireStaffAction(capability?: Capability): Promise<StaffSummary> {
  const state = await getSessionState()
  if (state.status !== "authenticated") throw new Error("UNAUTHENTICATED")
  if (capability && !can(state.staff.role, capability)) throw new Error("FORBIDDEN")
  return state.staff
}

export type { SessionState, StaffSummary }
