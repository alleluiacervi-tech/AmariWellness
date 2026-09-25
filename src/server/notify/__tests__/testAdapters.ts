import type { EmailAdapter, EmailMessage } from "../email"
import type { WhatsAppAdapter, WhatsAppMessage } from "../whatsapp"
import type { NotifyDeps } from "../bookingMessages"

/** Adapters that record what they were asked to send instead of sending it — so a test can assert exactly what a client would have received. */
export function capturingDeps(options: { failEmail?: boolean; failWhatsApp?: boolean } = {}) {
  const emails: EmailMessage[] = []
  const whatsapps: WhatsAppMessage[] = []
  const email: EmailAdapter = {
    name: "test-email",
    async send(message) {
      if (options.failEmail) throw new Error("Email provider is down")
      emails.push(message)
      return { providerMessageId: `email-${emails.length}` }
    },
  }
  const whatsapp: WhatsAppAdapter = {
    name: "test-whatsapp",
    async send(message) {
      if (options.failWhatsApp) throw new Error("WhatsApp provider is down")
      whatsapps.push(message)
      return { providerMessageId: `wa-${whatsapps.length}` }
    },
  }
  const deps: NotifyDeps = { email, whatsapp, siteUrl: "https://amari.test" }
  return { deps, emails, whatsapps }
}
