import RealBookingFlow from "@/components/RealBookingFlow"
import { getSessionTypes, getSiteConfig } from "@/server/db/content"
import { getClientSessionState } from "@/server/client-auth/dal"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Book a session",
  description:
    "Choose your session, day and time, and how you would like to pay. Private massage suites in Kimihurura, Kigali.",
  path: "/book",
})

/**
 * The real booking flow (Phase 1.4b — see CLAUDE.md). Unlike every other
 * public page, this one can't stay static: checking whether a slot is
 * genuinely free means asking the database at request time. Sessions
 * and site config are fetched here, once per request, and handed down
 * as props — the client component never reads `src/data/*.ts`.
 */
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string }>
}) {
  const [sessions, siteConfig, sessionState, params] = await Promise.all([
    getSessionTypes(),
    getSiteConfig(),
    getClientSessionState(),
    searchParams,
  ])
  const client =
    sessionState.status === "authenticated" && sessionState.client.phone
      ? {
          id: sessionState.client.id,
          name: sessionState.client.name,
          phone: sessionState.client.phone,
          needsHealthAck: !sessionState.client.healthAcknowledgedAt,
        }
      : null
  const initialSessionId = sessions.find((s) => s.id === params.session)?.id ?? sessions[0]?.id

  return (
    <main id="main-content" className="wrap booking">
      <div className="booking__head">
        <div className="booking__intro enter">
          <h1 className="h1">Book your quiet moment.</h1>
        </div>
      </div>
      <RealBookingFlow sessions={sessions} siteConfig={siteConfig} client={client} initialSessionId={initialSessionId} />
    </main>
  )
}
