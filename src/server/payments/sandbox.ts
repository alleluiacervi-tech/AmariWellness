// No `server-only` guard, deliberately — see conflicts.ts's comment.
// `availability/confirm.ts` imports this directly and is itself meant
// to be testable without Next's runtime, so nothing in this chain can
// carry the guard.
import { randomUUID } from "node:crypto"
import type { ChargeRequest, ChargeResult, PaymentProvider } from "./types"

/**
 * Never moves real money — Phase 0 hasn't chosen a real provider yet
 * (see docs/phase-0-decisions.md §1). `charge()` behaves exactly like a
 * real MoMo/Airtel/card charge would: it returns "pending" immediately,
 * never "succeeded" — nothing in this app treats a charge as paid until
 * something calls back to confirm it (see `src/server/availability/confirm.ts`).
 * For the sandbox, that callback is `confirmSandboxPayment` there instead
 * of a provider's webhook — the client-facing "pay" step (Phase 1.4b)
 * calls it directly, standing in for a real gateway's redirect-back or
 * push notification.
 */
export const sandboxProvider: PaymentProvider = {
  name: "sandbox",

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    return { providerReference: `sandbox_${randomUUID()}`, status: "pending" }
  },
}
