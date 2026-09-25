import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

/**
 * An optimistic, cookie-only check (no database call — Proxy runs on
 * every request, including prefetches, so it must stay cheap). This is
 * a UX convenience that redirects a clearly-signed-out visitor before
 * the page even renders; it is not the security boundary. The
 * authoritative check is `requireStaffPage`/`requireStaffAction` in
 * `src/server/auth/dal.ts`, which hits the database and is what every
 * page and Server Action actually relies on — see the Next.js
 * authentication guide's note that Proxy "should not be your only line
 * of defense."
 */
const COOKIE_NAME = "amari_staff_session"

async function hasPlausibleSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  const secret = process.env.SESSION_SECRET
  if (!secret) return false
  try {
    await jwtVerify(token, new TextEncoder().encode(secret))
    return true
  } catch {
    return false
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (!pathname.startsWith("/staff")) return NextResponse.next()
  if (pathname === "/staff/login") return NextResponse.next()

  if (!(await hasPlausibleSession(request))) {
    return NextResponse.redirect(new URL("/staff/login", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/staff/:path*"],
}
