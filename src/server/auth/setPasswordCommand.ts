/**
 * Sets a staff member's password from the command line, against whatever
 * database `DATABASE_URL` points at, including production. For the
 * owner: claiming the seeded accounts, or recovering one when nobody can
 * sign in to it. Staff change their own password in the workspace at
 * `/staff/password`.
 *
 *   pnpm staff:password owner@amari.rw
 *   pnpm staff:password desk@amari.rw --temporary     they choose their own at next sign-in
 *   pnpm staff:password owner@amari.rw --reset-2fa    the next sign-in sets up the authenticator again
 *
 * The password is typed at a hidden prompt, never passed as an argument,
 * so it doesn't end up in shell history or the process list. It also
 * signs the account out everywhere and clears any lockout.
 */
import { config } from "dotenv"
config({ path: ".env.local" })
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "../db/schema"
import { activityLog, staffUsers } from "../db/schema"
import { PasswordError, setStaffPassword } from "./staffPassword"

const USAGE = "Usage: pnpm staff:password <email> [--temporary] [--reset-2fa]"

/** Reads one line without echoing it. Piped input (not a terminal) is read as plain lines, for scripts and tests. */
function prompt(question: string, lines: AsyncIterator<string> | null): Promise<string> {
  if (lines) return lines.next().then((r) => (r.done ? "" : r.value))
  return new Promise((resolve, reject) => {
    const input = process.stdin
    process.stdout.write(question)
    input.setRawMode(true)
    input.resume()
    input.setEncoding("utf8")
    let value = ""
    const done = (err?: Error) => {
      input.setRawMode(false)
      input.pause()
      input.off("data", onData)
      process.stdout.write("\n")
      if (err) reject(err)
      else resolve(value)
    }
    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") return done()
        if (ch === "\u0003") return done(new Error("Cancelled."))
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1)
        else if (ch >= " ") value += ch
      }
    }
    input.on("data", onData)
  })
}

async function* stdinLines(): AsyncGenerator<string> {
  let buffer = ""
  for await (const chunk of process.stdin) {
    buffer += chunk.toString()
    let newline
    while ((newline = buffer.indexOf("\n")) >= 0) {
      yield buffer.slice(0, newline).replace(/\r$/, "")
      buffer = buffer.slice(newline + 1)
    }
  }
  if (buffer) yield buffer
}

async function main() {
  const args = process.argv.slice(2)
  const flags = new Set(args.filter((a) => a.startsWith("--")))
  const [emailArg, ...extra] = args.filter((a) => !a.startsWith("--"))
  const unknown = [...flags].filter((f) => f !== "--temporary" && f !== "--reset-2fa")
  if (!emailArg || extra.length || unknown.length) {
    console.error(unknown.length ? `Unknown option ${unknown.join(", ")}.\n${USAGE}` : USAGE)
    process.exit(2)
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is not set")
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client, { schema })

  try {
    const email = emailArg.trim().toLowerCase()
    const [staff] = await db.select().from(staffUsers).where(eq(staffUsers.email, email)).limit(1)
    if (!staff) {
      const all = await db.select({ email: staffUsers.email }).from(staffUsers)
      console.error(`No staff account for ${email}. Accounts: ${all.map((s) => s.email).join(", ") || "none"}.`)
      process.exitCode = 1
      return
    }

    console.log(`Database: ${connectionString.replace(/:[^:@/]+@/, ":***@")}`)
    const lines = process.stdin.isTTY ? null : stdinLines()[Symbol.asyncIterator]()
    const password = await prompt(`New password for ${staff.email}: `, lines)
    const again = await prompt("Type it again: ", lines)
    if (password !== again) {
      console.error("The two didn't match. Nothing was changed.")
      process.exitCode = 1
      return
    }

    const temporary = flags.has("--temporary")
    const resetTwoFactor = flags.has("--reset-2fa")
    let result: { sessionsEnded: number }
    try {
      result = await setStaffPassword(db, staff.id, password, { temporary, resetTwoFactor })
    } catch (err) {
      if (err instanceof PasswordError) {
        console.error(`${err.message} Nothing was changed.`)
        process.exitCode = 1
        return
      }
      throw err
    }
    await db.insert(activityLog).values({
      staffUserId: null,
      action: "staff.passwordSetFromCommandLine",
      entityType: "staff_user",
      entityId: staff.id,
      after: JSON.stringify({ temporary, twoFactorReset: resetTwoFactor, sessionsEnded: result.sessionsEnded }),
    })

    console.log(`Password set for ${staff.email}.`)
    if (result.sessionsEnded) console.log(`Signed out of ${result.sessionsEnded} session${result.sessionsEnded === 1 ? "" : "s"}.`)
    if (temporary) console.log("They'll be asked to choose their own at their next sign-in.")
    if (resetTwoFactor) console.log("Two-step verification was reset: the next sign-in sets up the authenticator app again.")
    else if (!staff.totpSecret) console.log("Two-step verification isn't set up yet: the next sign-in sets it up.")
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
