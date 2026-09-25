/**
 * The one-time-code delivery adapter, selected by `SMS_PROVIDER`
 * (`.env.example`) — same adapter-per-provider pattern as
 * `src/server/payments/`. No `server-only` guard: nothing here touches
 * the database or a secret worth keeping out of a client bundle, and
 * keeping it plain makes the adapter itself directly testable.
 */

export interface SmsAdapter {
  readonly name: string
  send(to: string, body: string): Promise<void>
}

/** Logs instead of sending — safe for local development and this phase, since a real SMS/WhatsApp provider (Africa's Talking or similar) is a Phase 0 decision not yet made. See docs/phase-0-decisions.md §1. */
export const consoleSmsAdapter: SmsAdapter = {
  name: "console",
  async send(to, body) {
    console.log(`[sms:console] to=${to} ${body}`)
  },
}

export function getSmsAdapter(): SmsAdapter {
  const provider = process.env.SMS_PROVIDER ?? "console"
  if (provider === "console") return consoleSmsAdapter
  throw new Error(`Unknown SMS_PROVIDER: ${provider}`)
}
