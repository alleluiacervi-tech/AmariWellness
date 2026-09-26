/** The short reference a client quotes at the desk or in a message — the first 8 hex digits of the booking's id. Shared by the confirmation screen, messages and the staff views, so all three always agree. */
export function bookingReference(bookingId: string): string {
  return `AM-${bookingId.slice(0, 8).toUpperCase()}`
}
