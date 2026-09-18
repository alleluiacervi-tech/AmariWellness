import AdminDashboard from "@/components/admin/AdminDashboard"
export const metadata = {
  title: "Workspace sign in",
  robots: { index: false, follow: false },
}
export default function AdminLoginPage() {
  return <AdminDashboard startAtLogin />
}
