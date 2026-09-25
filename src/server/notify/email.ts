/**
 * Booking email delivery (Phase 1.5), selected by `EMAIL_PROVIDER`
 * (`.env.example`) — the same adapter-per-provider pattern as `sms.ts`
 * and `src/server/payments/`. No `server-only` guard, so the adapter and
 * everything that sends through it stay testable in plain vitest.
 */

export type EmailAttachment = {
  filename: string
  contentType: string
  content: Buffer
  /** Set to reference the attachment inline from the HTML body as `cid:<contentId>` — how the QR code is shown in the message itself. */
  contentId?: string
}

export type EmailMessage = {
  to: string
  subject: string
  text: string
  html: string
  attachments?: EmailAttachment[]
}

export type SendResult = { providerMessageId?: string }

export interface EmailAdapter {
  readonly name: string
  send(message: EmailMessage): Promise<SendResult>
}

/** Logs instead of sending — the email provider (Resend or Postmark, CLAUDE.md §4) is a Phase 0 decision not yet made. Attachments are summarised, not dumped. */
export const consoleEmailAdapter: EmailAdapter = {
  name: "console",
  async send(message) {
    const attachments = (message.attachments ?? []).map((a) => `${a.filename} (${a.content.length} bytes)`).join(", ")
    console.log(
      `[email:console] to=${message.to} subject=${JSON.stringify(message.subject)}${attachments ? ` attachments=${attachments}` : ""}\n${message.text}`,
    )
    return {}
  },
}

export function getEmailAdapter(): EmailAdapter {
  const provider = process.env.EMAIL_PROVIDER ?? "console"
  if (provider === "console") return consoleEmailAdapter
  throw new Error(`Unknown EMAIL_PROVIDER: ${provider}`)
}
