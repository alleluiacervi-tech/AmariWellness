import Link from "next/link"
import { requireStaffPage } from "@/server/auth/dal"
import { logoutAction } from "@/server/auth/actions"
import { MIN_PASSWORD_LENGTH } from "@/server/auth/staffPassword"
import ChangePasswordForm from "./ChangePasswordForm"

export const metadata = {
  title: "Your password — Amari workspace",
  robots: { index: false, follow: false },
}

/**
 * Change your own password — any time from the staff home, and the one
 * page someone still on a password somebody else set can reach (every
 * other staff page redirects here until they've chosen their own; see
 * `requireStaffPage`).
 */
export default async function StaffPasswordPage() {
  const staff = await requireStaffPage(undefined, { allowPasswordChange: true })
  const firstTime = staff.mustChangePassword

  return (
    <main id="main-content" className="surface-paper">
      <div className="wrap sec--tight stack" style={{ maxWidth: 480 }}>
        <div className="stack--tight">
          {firstTime ? (
            <p className="label">Amari workspace</p>
          ) : (
            <Link className="tlink" href="/staff">
              ← Workspace
            </Link>
          )}
          <h1 className="h2">{firstTime ? "Choose your own password" : "Change your password"}</h1>
          <p className="body">
            {firstTime
              ? "You signed in with a password someone else set up. Choose your own before you carry on; nobody else will know it."
              : "Changing it signs you out on every other device."}
          </p>
          <p className="meta">
            At least {MIN_PASSWORD_LENGTH} characters. A few words together is long enough and easy to remember.
          </p>
        </div>

        <ChangePasswordForm email={staff.email} minLength={MIN_PASSWORD_LENGTH} />

        {firstTime && (
          <form action={logoutAction}>
            <button className="btn btn--outline" type="submit">
              Sign out
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
