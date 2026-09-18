export type Role = "Superadmin" | "Finance"
export type Section = "overview" | "bookings" | "suites" | "guests" | "payments" | "packs" | "invoices" | "inbox" | "content" | "reports" | "team" | "settings" | "activity"
export type Booking = {
  id: string
  guest: string
  time: string
  duration: number
  suite: number
  status: string
  amount: number
}
export type Payment = {
  id: string
  guest: string
  booking: string
  amount: number
  method: string
  status: string
  reconciled: boolean
  reason?: string
}
export type Suite = {
 id: number
 name: string
 status: string
 note: string
}
export const navigation: {
  id: Section
  label: string
  group: string
  finance: boolean
}[] = [
  { id: "overview", label: "Overview", group: "Workspace", finance: true },
  { id: "bookings", label: "Bookings", group: "Workspace", finance: true },
  {
    id: "suites",
    label: "Suites & operations",
    group: "Workspace",
    finance: false,
  },
  { id: "guests", label: "Guests", group: "Workspace", finance: false },
  { id: "payments", label: "Payments", group: "Business", finance: true },
  { id: "packs", label: "Packs & vouchers", group: "Business", finance: true },
  {
    id: "invoices",
    label: "Corporate invoices",
    group: "Business",
    finance: true,
  },
  { id: "reports", label: "Reports", group: "Business", finance: true },
  { id: "inbox", label: "Inbox", group: "Manage", finance: false },
  { id: "content", label: "Website content", group: "Manage", finance: false },
  { id: "team", label: "Team & access", group: "Manage", finance: false },
  { id: "settings", label: "Settings", group: "Manage", finance: true },
  { id: "activity", label: "Activity log", group: "Manage", finance: true },
]
export const bookingsSeed: Booking[] = [
  {
    id: "AMR-1041",
    guest: "Alex Morgan",
    time: "10:00",
    duration: 30,
    suite: 1,
    status: "Completed",
    amount: 12000,
  },
  {
    id: "AMR-1042",
    guest: "Jamie Lee",
    time: "11:00",
    duration: 60,
    suite: 2,
    status: "Completed",
    amount: 20000,
  },
  {
    id: "AMR-1043",
    guest: "Sam Taylor",
    time: "14:00",
    duration: 30,
    suite: 1,
    status: "In session",
    amount: 12000,
  },
  {
    id: "AMR-1044",
    guest: "Robin Ellis",
    time: "14:30",
    duration: 15,
    suite: 3,
    status: "Confirmed",
    amount: 6500,
  },
  {
    id: "AMR-1045",
    guest: "Jordan Avery",
    time: "15:00",
    duration: 60,
    suite: 2,
    status: "Confirmed",
    amount: 20000,
  },
  {
    id: "AMR-1046",
    guest: "Casey Quinn",
    time: "16:00",
    duration: 30,
    suite: 1,
    status: "Awaiting payment",
    amount: 15000,
  },
  {
    id: "AMR-1047",
    guest: "Drew Parker",
    time: "17:00",
    duration: 30,
    suite: 3,
    status: "Cancelled",
    amount: 15000,
  },
]
export const paymentsSeed: Payment[] = bookingsSeed.map((b, i) => ({
  id: `TX-${2041 + i}`,
  guest: b.guest,
  booking: b.id,
  amount: b.amount,
  method: [
    "MTN MoMo",
    "Visa",
    "Pack credit",
    "Airtel Money",
    "Mastercard",
    "MTN MoMo",
    "Visa",
  ][i],
  status:
    i === 5 ? "Pending" : i === 6 ? "Refunded" : i === 2 ? "Redeemed" : "Paid",
  reconciled: i < 2,
}))
export const suitesSeed: Suite[] = [
  {
    id: 1,
    name: "Suite One",
    status: "Occupied",
    note: "Sam Taylor · ends 14:30",
  },
  {
    id: 2,
    name: "Suite Two",
    status: "Cleaning",
    note: "Next arrival · 15:00",
  },
  { id: 3, name: "Suite Three", status: "Ready", note: "Next arrival · 14:30" },
  {
    id: 4,
    name: "Suite Four",
    status: "Maintenance",
    note: "Control panel inspection",
  },
]
export const money = (amount: number) =>
  `${new Intl.NumberFormat("en-RW").format(amount)} RWF`
export const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}
export const descriptions: Record<Section, string> = {
  overview: "A clear view of your lounge, and a little room to breathe.",
  bookings: "Every arrival, every session, all in one place.",
  suites: "Keep the rooms ready for their next quiet moment.",
  guests: "Thoughtful service begins with knowing your guests.",
  payments: "Follow each payment from collection to reconciliation.",
  packs: "Session balances and gifts, with a clear history.",
  invoices: "Simple billing for your corporate partners.",
  inbox: "A considered response to every enquiry.",
  content: "Keep the Amari story fresh and consistent.",
  reports: "Understand the numbers behind the experience.",
  team: "Two roles. Clear responsibility. Your workspace.",
  settings: "The details that keep the day running smoothly.",
  activity: "A traceable history of changes in this preview.",
}
