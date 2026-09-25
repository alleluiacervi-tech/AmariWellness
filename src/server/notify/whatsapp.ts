/**
 * Booking WhatsApp delivery (Phase 1.5), selected by `WHATSAPP_PROVIDER`
 * (`.env.example`) — same pattern as `email.ts`.
 *
 * A real WhatsApp Business Cloud API adapter will need two things this
 * interface already carries: an image (the QR, uploaded as media before
 * the message is sent) and plain text. Outside the 24-hour customer
 * service window Meta only allows pre-approved templates, so that
 * adapter will map `message.template` to an approved template name —
 * which is why the template is passed through rather than just the text.
 */
import type { NotificationTemplate } from "../db/schema"
import type { SendResult } from "./email"

export type WhatsAppMessage = {
  to: string
  template: NotificationTemplate
  text: string
  image?: { content: Buffer; contentType: string; filename: string }
}

export interface WhatsAppAdapter {
  readonly name: string
  send(message: WhatsAppMessage): Promise<SendResult>
}

export const consoleWhatsAppAdapter: WhatsAppAdapter = {
  name: "console",
  async send(message) {
    const image = message.image ? ` image=${message.image.filename} (${message.image.content.length} bytes)` : ""
    console.log(`[whatsapp:console] to=${message.to} template=${message.template}${image}\n${message.text}`)
    return {}
  },
}

export function getWhatsAppAdapter(): WhatsAppAdapter {
  const provider = process.env.WHATSAPP_PROVIDER ?? "console"
  if (provider === "console") return consoleWhatsAppAdapter
  throw new Error(`Unknown WHATSAPP_PROVIDER: ${provider}`)
}
