import type { PaymentMethod } from "../db/schema"

export type { PaymentMethod }

export type ChargeRequest = {
  /** Our own idempotency reference (e.g. the booking id) — a real provider's dashboard would show this alongside its own reference. */
  reference: string
  amountRwf: number
  method: PaymentMethod
  /** Required for momo/airtel; unused for card/other. */
  phone?: string
}

export type ChargeResult = {
  providerReference: string
  /** Real providers never confirm synchronously (see `payments` schema comment) — a charge always starts "pending" and is resolved later by a webhook. */
  status: "pending"
}

export interface PaymentProvider {
  readonly name: string
  charge(request: ChargeRequest): Promise<ChargeResult>
}
