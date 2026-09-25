import { redirect } from "next/navigation"
import PageHeader from "@/components/PageHeader"
import { pageMetadata } from "@/lib/metadata"
import { getClientSessionState } from "@/server/client-auth/dal"
import AccountLoginForm from "./AccountLoginForm"

export const metadata = {
  ...pageMetadata({
    title: "Sign in",
    description: "Enter your phone number to see your bookings.",
    path: "/account/login",
  }),
  robots: { index: false, follow: false },
}

export default async function AccountLoginPage() {
  const state = await getClientSessionState()
  if (state.status === "authenticated") redirect("/account")

  return (
    <main id="main-content">
      <PageHeader title="Sign in." lead="Enter the phone number you booked with — we'll text a 6-digit code." />
      <div className="wrap sec--tight" style={{ maxWidth: 420 }}>
        <AccountLoginForm />
      </div>
    </main>
  )
}
