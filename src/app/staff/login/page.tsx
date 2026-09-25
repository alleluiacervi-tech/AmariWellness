import StaffLoginForm from "./StaffLoginForm"

export const metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
}

export default function StaffLoginPage() {
  return (
    <main id="main-content" className="surface-paper" style={{ minHeight: "100svh", display: "grid", placeItems: "center" }}>
      <div className="wrap" style={{ maxWidth: 400, paddingBlock: "clamp(48px, 8vh, 96px)" }}>
        <div className="stack" style={{ gap: 32 }}>
          <div className="stack--tight">
            <p className="label">Amari workspace</p>
            <h1 className="h2">Staff sign in</h1>
          </div>
          <StaffLoginForm />
        </div>
      </div>
    </main>
  )
}
