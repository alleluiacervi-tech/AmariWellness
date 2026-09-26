const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Whether a string from a URL or a scanned code is a well-formed id — checked before it reaches a `uuid` column, where a malformed one is a database error (a 500), not "not found". */
export function isUuid(value: string): boolean {
  return UUID.test(value)
}
