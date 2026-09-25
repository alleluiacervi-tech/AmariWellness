import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { readClientSessionState, type ClientSessionState, type ClientSummary } from "./session"

/** Memoized per request — see `src/server/auth/dal.ts`'s identical reasoning for the staff version. */
export const getClientSessionState = cache(readClientSessionState)

/** For a Server Component/page that requires a signed-in client. */
export async function requireClientPage(): Promise<ClientSummary> {
  const state = await getClientSessionState()
  if (state.status !== "authenticated") redirect("/account/login")
  return state.client
}

/** For a Server Action — throws instead of redirecting, the same reasoning as `requireStaffAction`. */
export async function requireClientAction(): Promise<ClientSummary> {
  const state = await getClientSessionState()
  if (state.status !== "authenticated") throw new Error("UNAUTHENTICATED")
  return state.client
}

export type { ClientSessionState, ClientSummary }
