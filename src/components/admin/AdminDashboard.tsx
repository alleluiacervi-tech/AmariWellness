"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react"
import Icon from "./Icon"
import {
  bookingsSeed,
  paymentsSeed,
  suitesSeed,
  navigation,
  descriptions,
  money,
  minutes,
  type Booking,
  type Payment,
  type Role,
  type Section,
} from "./data"
import "./admin.css"

type Modal = {
 type: string
 id?: string
}
type Activity = {
 id: string
 text: string
 role: Role
 finance: boolean
}
const collected = (p: Payment) =>
  p.status === "Paid" || p.status === "Refund requested"
function Badge({ children }: { children: string }) {
  return (
    <span
      className={`ad-badge ad-badge--${children.toLowerCase().replaceAll(" ", "-")}`}
    >
      {children}
    </span>
  )
}
function Empty({
  text = "Nothing here yet.",
  detail = "Try another filter or add a sample record.",
}: {
  text?: string
  detail?: string
}) {
  return (
    <div className="ad-empty">
      <Icon name="search" size={30} />
      <h3>{text}</h3>
      <p>{detail}</p>
    </div>
  )
}
function Table({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return rows.length ? (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} data-label={headers[j]}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  )
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="ad-field">
      <span>{label}</span>
      {children}
    </label>
  )
}
function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`ad-panel ${className}`}>
      <div className="ad-panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const el = ref.current
    el?.showModal()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      el?.close()
      document.body.style.overflow = previous
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="ad-dialog"
      aria-labelledby="ad-dialog-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="ad-dialog-head">
        <div>
          <p className="ad-eyebrow">Amari workspace · preview</p>
          <h2 id="ad-dialog-title">{title}</h2>
        </div>
        <button
          className="ad-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="ad-dialog-body">{children}</div>
    </dialog>
  )
}

export default function AdminDashboard({
  startAtLogin = false,
}: {
  startAtLogin?: boolean
}) {
  const [role, setRole] = useState<Role>("Superadmin")
  const [signedIn, setSignedIn] = useState(!startAtLogin)
  const [section, setSection] = useState<Section>("overview")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bookings, setBookings] = useState(bookingsSeed)
  const [payments, setPayments] = useState(paymentsSeed)
  const [suites, setSuites] = useState(suitesSeed)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All")
  const [view, setView] = useState("List")
  const [modal, setModal] = useState<Modal | null>(null)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "initial",
      text: "Sample day loaded. All records are fictional.",
      role: "Superadmin",
      finance: true,
    },
  ])
  const [packs, setPacks] = useState([
    {
      id: "PK-301",
      guest: "Sam Taylor",
      name: "Five Half Hours",
      balance: 4,
      unit: "sessions",
      expires: "18 Nov 2026",
    },
    {
      id: "PK-302",
      guest: "Alex Morgan",
      name: "Ten Half Hours",
      balance: 6,
      unit: "sessions",
      expires: "18 Dec 2026",
    },
    {
      id: "GV-303",
      guest: "Jamie Lee",
      name: "Gift voucher",
      balance: 25000,
      unit: "RWF",
      expires: "18 Sep 2027",
    },
  ])
  const [invoices, setInvoices] = useState([
    {
      id: "INV-041",
      company: "Studio North (sample)",
      amount: 127000,
      status: "Outstanding",
    },
    {
      id: "INV-042",
      company: "Greenline Team (sample)",
      amount: 67000,
      status: "Draft",
    },
  ])
  const [messages, setMessages] = useState([
    {
      id: "M1",
      name: "Studio North",
      subject: "A quiet afternoon for our team",
      text: "We would like to explore a pack for ten colleagues. Could you share the available options?",
      status: "New",
      draft: "",
    },
    {
      id: "M2",
      name: "Alex Morgan",
      subject: "Moving my next session",
      text: "Would it be possible to move my appointment to the following afternoon?",
      status: "New",
      draft: "",
    },
    {
      id: "M3",
      name: "Jamie Lee",
      subject: "Gift voucher question",
      text: "Can I give a voucher to a friend and let them choose their own time?",
      status: "Resolved",
      draft: "",
    },
  ])
  const [content, setContent] = useState([
    {
      id: "home",
      name: "Homepage",
      title: "A little time. Entirely yours.",
      body: "Private massage suites in Kigali. Settle in, switch off, and unwind at your pace.",
      status: "Published sample",
    },
    {
      id: "sessions",
      name: "Sessions",
      title: "Find your own kind of pause.",
      body: "Fifteen minutes or a whole hour. The same private space, with a little more time to make it yours.",
      status: "Published sample",
    },
    {
      id: "journal",
      name: "Journal",
      title: "A note on slowing down",
      body: "Small thoughts on making room for yourself.",
      status: "Draft",
    },
  ])
  const [financeEnabled, setFinanceEnabled] = useState(true)
  const [settings, setSettings] = useState({
    name: "Amari",
    location: "Kimihurura, Kigali",
    open: "10:00",
    close: "21:00",
    turnover: 15,
    cancellation: 4,
  })
  const [accountName, setAccountName] = useState("Finance preview")
  const [period, setPeriod] = useState("Today")
  const pageTitle =
    navigation.find((n) => n.id === section)?.label ?? "Overview"
  const admin = role === "Superadmin"
  const canView = (id: Section) =>
    admin || Boolean(navigation.find((n) => n.id === id)?.finance)
  const visiblePayments = payments.filter(
    (p) =>
      `${p.guest} ${p.id} ${p.method} ${p.booking}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All" || p.status === filter),
  )
  const visibleBookings = bookings
    .filter(
      (b) =>
        `${b.id} ${b.guest} ${b.time}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (filter === "All" || b.status === filter),
    )
    .sort((a, b) => a.time.localeCompare(b.time))
  const totalCollected = payments
    .filter(collected)
    .reduce((sum, p) => sum + p.amount, 0)
  const pendingAmount = payments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0)
  const refunds = payments.filter((p) => p.status === "Refund requested")
  const unreconciled = payments.filter((p) => collected(p) && !p.reconciled)
  const upcoming = bookings
    .filter((b) =>
      ["Confirmed", "Checked in", "Awaiting payment"].includes(b.status),
    )
    .sort((a, b) => a.time.localeCompare(b.time))
  const selectedBooking = bookings.find((b) => b.id === modal?.id)
  const selectedPayment = payments.find((p) => p.id === modal?.id)
  const selectedPack = packs.find((p) => p.id === modal?.id)
  const selectedInvoice = invoices.find((p) => p.id === modal?.id)
  const selectedMessage = messages.find((p) => p.id === modal?.id)
  const selectedContent = content.find((p) => p.id === modal?.id)
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(""), 5000)
    return () => clearTimeout(id)
  }, [toast])
  function open(type: string, id?: string) {
    setError("")
    setModal({ type, id })
  }
  function go(id: Section) {
    if (!canView(id)) return
    setSection(id)
    setQuery("")
    setFilter("All")
    setMobileOpen(false)
    setModal(null)
    requestAnimationFrame(() => headingRef.current?.focus())
  }
  function changeRole(next: Role) {
    setRole(next)
    setSection("overview")
    setModal(null)
    setFilter("All")
    setQuery("")
    setMobileOpen(false)
  }
  function record(text: string, finance = false) {
    setActivities((a) => [
      { id: crypto.randomUUID(), text, role, finance },
      ...a,
    ])
    setToast(`${text} · Preview only`)
  }
  function close() {
    setModal(null)
    setError("")
  }
  function updateBooking(b: Booking, status: string) {
    if (!admin) return
    setBookings((all) => all.map((x) => (x.id === b.id ? { ...x, status } : x)))
    if (status === "In session")
      setSuites((all) =>
        all.map((s) =>
          s.id === b.suite
            ? {
                ...s,
                status: "Occupied",
                note: `${b.guest} · ${b.duration} min`,
              }
            : s,
        ),
      )
    if (status === "Completed")
      setSuites((all) =>
        all.map((s) =>
          s.id === b.suite
            ? { ...s, status: "Cleaning", note: "Turnover checklist required" }
            : s,
        ),
      )
    record(`${b.id} marked ${status.toLowerCase()}`)
    close()
  }
  function conflict(
    suite: number,
    time: string,
    duration: number,
    ignore?: string,
  ) {
    return bookings.some(
      (b) =>
        b.id !== ignore &&
        b.suite === suite &&
        !["Cancelled", "Completed", "No-show"].includes(b.status) &&
        minutes(time) < minutes(b.time) + b.duration + settings.turnover &&
        minutes(time) + duration + settings.turnover > minutes(b.time),
    )
  }
  function saveBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!admin) return
    const f = new FormData(event.currentTarget)
    const time = String(f.get("time")),
      suite = Number(f.get("suite")),
      duration = Number(f.get("duration")),
      guest = String(f.get("guest")).trim()
    if (!guest) {
      setError("Enter a guest name.")
      return
    }
    if (
      minutes(time) < minutes(settings.open) ||
      minutes(time) + duration + settings.turnover > minutes(settings.close)
    ) {
      setError("Choose a time within opening hours, including turnover.")
      return
    }
    if (conflict(suite, time, duration, selectedBooking?.id)) {
      setError(
        "That suite has another booking or turnover during this time. Choose a different suite or time.",
      )
      return
    }
    if (selectedBooking) {
      setBookings((all) =>
        all.map((b) =>
          b.id === selectedBooking.id ? { ...b, time, suite } : b,
        ),
      )
      record(`${selectedBooking.id} rescheduled to ${time}`)
    } else {
      const id = `AMR-${Date.now().toString().slice(-6)}`
      const amount = duration === 15 ? 8000 : duration === 30 ? 15000 : 25000
      setBookings((a) => [
        ...a,
        {
          id,
          guest,
          time,
          suite,
          duration,
          amount,
          status: "Awaiting payment",
        },
      ])
      setPayments((a) => [
        ...a,
        {
          id: `TX-${Date.now().toString().slice(-6)}`,
          guest,
          booking: id,
          amount,
          method: "MTN MoMo",
          status: "Pending",
          reconciled: false,
        },
      ])
      record(`Created sample booking for ${guest}`)
    }
    close()
  }
  function exportCsv() {
    const rows: (string | number)[][] =
      section === "bookings"
        ? [
            ["Reference", "Guest", "Time", "Minutes", "Suite", "Status"],
            ...visibleBookings.map((b) => [
              b.id,
              b.guest,
              b.time,
              b.duration,
              b.suite,
              b.status,
            ]),
          ]
        : section === "invoices"
          ? [
              ["Invoice", "Company", "RWF", "Status"],
              ...invoices.map((i) => [i.id, i.company, i.amount, i.status]),
            ]
          : [
              [
                "Reference",
                "Guest",
                "Booking",
                "RWF",
                "Method",
                "Status",
                "Reconciled",
              ],
              ...visiblePayments.map((p) => [
                p.id,
                p.guest,
                p.booking,
                p.amount,
                p.method,
                p.status,
                p.reconciled ? "Yes" : "No",
              ]),
            ]
    const csv = rows
      .map((r) =>
        r.map((value) => {
          const s = String(value)
          return `"${(/^[=+@\-]/.test(s) ? "'" + s : s).replaceAll('"', '""')}"`
        }).join(","),
      )
      .join("\r\n")
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `amari-sample-${section}.csv`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    record(`Exported sample ${section}`, true)
  }
  function toolbar(options: string[]) {
    return (
      <div className="ad-toolbar">
        <label className="ad-search">
          <Icon name="search" />
          <input
            aria-label={`Search ${pageTitle}`}
            placeholder={`Search ${pageTitle.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="ad-filter">
          <span className="ad-sr">Filter status</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            {options.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {(query || filter !== "All") && (
          <button
            className="ad-text-button"
            onClick={() => {
              setQuery("")
              setFilter("All")
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    )
  }
  const bookingRows = (items: Booking[]) =>
    items.map((b) => [
      <div key="guest" className="ad-person">
        <span className="ad-avatar">
          {b.guest
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
        <span>
          <strong>{b.guest}</strong>
          <small>{b.id}</small>
        </span>
      </div>,
      <span key="time" className="ad-time">
        {b.time}
        <small>{b.duration} minutes</small>
      </span>,
      `Suite ${b.suite}`,
      <Badge key="status">{b.status}</Badge>,
      <button
        key="action"
        className="ad-row-button"
        onClick={() => open("booking", b.id)}
      >
        Details
      </button>,
    ])
  function stats() {
    const data = admin
      ? [
          [
            "Sessions today",
            String(bookings.filter((b) => b.status !== "Cancelled").length),
            "Across all four suites",
            "bookings",
          ],
          [
            "Collected today",
            money(totalCollected),
            "Refunds and pack credits excluded",
            "payments",
          ],
          [
            "Suites ready",
            `${suites.filter((s) => s.status === "Ready").length} / ${suites.length}`,
            "Live sample room status",
            "suites",
          ],
          [
            "Awaiting payment",
            money(pendingAmount),
            `${payments.filter((p) => p.status === "Pending").length} payment to follow up`,
            "payments",
          ],
        ]
      : [
          [
            "Collected today",
            money(totalCollected),
            "Successful payments, net of refunds",
            "payments",
          ],
          [
            "Awaiting payment",
            money(pendingAmount),
            "Pending sample transactions",
            "payments",
          ],
          [
            "To reconcile",
            String(unreconciled.length),
            "Successful payments needing review",
            "payments",
          ],
          [
            "Refund requests",
            String(refunds.length),
            "Superadmin approval required",
            "payments",
          ],
        ]
    return (
      <div className="ad-stats">
        {data.map(([label, value, note, target]) => (
          <button
            key={label}
            className="ad-stat"
            onClick={() => go(target as Section)}
          >
            <span>
              {label}
              <Icon name={target} />
            </span>
            <strong>{value}</strong>
            <small>{note}</small>
          </button>
        ))}
      </div>
    )
  }
  function overview() {
    return (
      <>
        {stats()}
        <div className="ad-main-grid">
          <Panel
            title={admin ? "The day, at a glance" : "Collections at a glance"}
            subtitle="Friday, 18 September 2026 · Sample day"
            action={
              <button
                className="ad-text-button"
                onClick={() => go(admin ? "bookings" : "payments")}
              >
                View all <Icon name="external" size={15} />
              </button>
            }
          >
            {admin ? (
              <>
                <div className="ad-timeline-label">
                  <span>UPCOMING ARRIVALS</span>
                  <span>{upcoming.length} expected</span>
                </div>
                <Table
                  headers={["Guest", "Time", "Suite", "Status", "Action"]}
                  rows={bookingRows(upcoming.slice(0, 4))}
                />
              </>
            ) : (
              <Table
                headers={[
                  "Transaction",
                  "Method",
                  "Amount",
                  "Status",
                  "Action",
                ]}
                rows={payments
                  .filter((p) => p.status !== "Redeemed")
                  .slice(0, 5)
                  .map((p) => [
                    p.id,
                    p.method,
                    money(p.amount),
                    <Badge key="badge">{p.status}</Badge>,
                    <button
                      key="a"
                      className="ad-row-button"
                      onClick={() => open("payment", p.id)}
                    >
                      Review
                    </button>,
                  ])}
              />
            )}
          </Panel>
          <Panel
            title="Needs your attention"
            subtitle="A short list, with clear next steps."
            className="ad-attention"
          >
            <button
              onClick={() => {
                go("payments")
                setFilter("Pending")
              }}
            >
              <span className="ad-attention-icon">
                <Icon name="payments" />
              </span>
              <span>
                <strong>
                  {payments.filter((p) => p.status === "Pending").length}{" "}
                  pending payment
                </strong>
                <small>Review the payment status</small>
              </span>
            </button>
            {admin && (
              <button onClick={() => go("suites")}>
                <span className="ad-attention-icon">
                  <Icon name="suites" />
                </span>
                <span>
                  <strong>
                    {suites.filter((s) => s.status === "Cleaning").length} suite
                    awaiting preparation
                  </strong>
                  <small>Open the turnover checklist</small>
                </span>
              </button>
            )}
            <button
              onClick={() => {
                go("payments")
                setFilter(refunds.length ? "Refund requested" : "All")
              }}
            >
              <span className="ad-attention-icon">
                <Icon name="invoices" />
              </span>
              <span>
                <strong>
                  {refunds.length
                    ? `${refunds.length} refund request`
                    : `${unreconciled.length} payments to reconcile`}
                </strong>
                <small>
                  {refunds.length
                    ? "Waiting for Superadmin approval"
                    : "Match with provider records"}
                </small>
              </span>
            </button>
            <div className="ad-quiet-note">
              <span className="ad-live-dot" />A little clarity for a calmer day.
              <p>All actions in this workspace affect sample data only.</p>
            </div>
          </Panel>
        </div>
        {admin ? (
          <Panel
            title="Your suites"
            subtitle="A small space, thoughtfully managed."
            action={
              <button className="ad-text-button" onClick={() => go("suites")}>
                Manage suites
              </button>
            }
          >
            <div className="ad-suite-strip">
              {suites.map((s) => (
                <button key={s.id} onClick={() => open("suite", String(s.id))}>
                  <span className="ad-suite-symbol">
                    <Icon name="suites" size={25} />
                  </span>
                  <strong>{s.name}</strong>
                  <Badge>{s.status}</Badge>
                  <small>{s.note}</small>
                </button>
              ))}
            </div>
          </Panel>
        ) : (
          <Panel
            title="Recent finance activity"
            subtitle="Every adjustment has a record."
          >
            {activityList(4)}
          </Panel>
        )}
      </>
    )
  }
  function bookingView() {
    return (
      <Panel
        title="Booking schedule"
        subtitle="18 September 2026 · CAT (UTC+2)"
        action={
          <div className="ad-segment" aria-label="Booking view">
            {["List", "Timeline"].map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
        }
      >
        {!admin && (
          <p className="ad-inline-note">
            Finance can inspect booking and payment references. Scheduling
            changes belong to Superadmin.
          </p>
        )}
        {toolbar([
          "All",
          "Confirmed",
          "Awaiting payment",
          "Checked in",
          "In session",
          "Completed",
          "Cancelled",
          "No-show",
        ])}
        {view === "List" ? (
          <Table
            headers={["Guest", "Time", "Suite", "Status", "Action"]}
            rows={bookingRows(visibleBookings)}
          />
        ) : (
          <div className="ad-agenda">
            {visibleBookings.length ? (
              visibleBookings.map((b) => (
                <button key={b.id} onClick={() => open("booking", b.id)}>
                  <time>{b.time}</time>
                  <span>
                    <strong>{b.guest}</strong>
                    <small>
                      {b.duration} minutes · Suite {b.suite} · {b.id}
                    </small>
                  </span>
                  <Badge>{b.status}</Badge>
                </button>
              ))
            ) : (
              <Empty />
            )}
          </div>
        )}
        <div className="ad-table-foot">
          {visibleBookings.length} bookings shown · Includes {settings.turnover}{" "}
          minutes of turnover between sessions
        </div>
      </Panel>
    )
  }
  function suiteView() {
    return (
      <>
        <div className="ad-callout">
          <Icon name="suites" />
          <p>
            Room status is managed manually. This preview has no connection to
            massage-chair hardware.
          </p>
        </div>
        <div className="ad-suite-grid">
          {suites.map((s) => (
            <section className="ad-panel ad-suite-card" key={s.id}>
              <div className="ad-suite-card-head">
                <Icon name="suites" size={34} />
                <Badge>{s.status}</Badge>
              </div>
              <p className="ad-eyebrow">PRIVATE MASSAGE SUITE</p>
              <h2>{s.name}</h2>
              <p>{s.note}</p>
              <div className="ad-suite-facts">
                <span>
                  Turnover<strong>{settings.turnover} min</strong>
                </span>
                <span>
                  Capacity<strong>1 guest</strong>
                </span>
              </div>
              <button
                className="ad-button ad-button--secondary"
                onClick={() => open("suite", String(s.id))}
              >
                {s.status === "Cleaning"
                  ? "Open cleaning checklist"
                  : "Manage suite"}
              </button>
            </section>
          ))}
        </div>
        <Panel
          title="Shift handover"
          subtitle="Leave a clear note for the next shift."
        >
          <form
            className="ad-form ad-padded"
            onSubmit={(e) => {
              e.preventDefault()
              const f = new FormData(e.currentTarget)
              record(`Handover note: ${String(f.get("note")).trim()}`)
              e.currentTarget.reset()
            }}
          >
            <Field label="Operational note">
              <textarea
                name="note"
                required
                maxLength={500}
                placeholder="e.g. Suite Four is waiting for its control panel inspection."
              />
            </Field>
            <button className="ad-button">Save sample note</button>
          </form>
        </Panel>
      </>
    )
  }
  function paymentsView() {
    return (
      <>
        <div className="ad-finance-summary">
          <div>
            <span>Collected</span>
            <strong>{money(totalCollected)}</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>{money(pendingAmount)}</strong>
          </div>
          <div>
            <span>Refunded</span>
            <strong>
              {money(
                payments
                  .filter((p) => p.status === "Refunded")
                  .reduce((a, p) => a + p.amount, 0),
              )}
            </strong>
          </div>
        </div>
        <Panel
          title="Transaction register"
          subtitle="Sample transactions · No payment provider connected"
        >
          {toolbar([
            "All",
            "Paid",
            "Pending",
            "Redeemed",
            "Refund requested",
            "Refunded",
          ])}
          <Table
            headers={[
              "Transaction",
              "Guest",
              "Method",
              "Amount",
              "Status",
              "Action",
            ]}
            rows={visiblePayments.map((p) => [
              <span key="id">
                <strong>{p.id}</strong>
                <small>{p.booking}</small>
              </span>,
              p.guest,
              p.method,
              <span key="amount" className="ad-amount">
                {money(p.amount)}
                {p.reconciled && <small>Reconciled</small>}
              </span>,
              <Badge key="s">{p.status}</Badge>,
              <button
                className="ad-row-button"
                key="a"
                onClick={() => open("payment", p.id)}
              >
                Review
              </button>,
            ])}
          />
          <div className="ad-table-foot">
            Pack redemptions are tracked separately and excluded from cash
            collections.
          </div>
        </Panel>
      </>
    )
  }
  function guestsView() {
    const names = Array.from(new Set(bookings.map((b) => b.guest))).filter(
      (n) => n.toLowerCase().includes(query.toLowerCase()),
    )
    return (
      <Panel
        title="Guest directory"
        subtitle="Fictional profiles for the design preview."
      >
        {toolbar(["All"])}
        <Table
          headers={["Guest", "Visits in sample", "Pack balance", "Action"]}
          rows={names.map((name) => [
            <strong key="n">{name}</strong>,
            bookings.filter((b) => b.guest === name && b.status === "Completed")
              .length,
            packs
              .filter((p) => p.guest === name)
              .map((p) => `${p.balance} ${p.unit}`)
              .join(" · ") || "No active pack",
            <button
              key="a"
              className="ad-row-button"
              onClick={() => open("guest", name)}
            >
              Open profile
            </button>,
          ])}
        />
      </Panel>
    )
  }
  function packsView() {
    return (
      <Panel
        title="Packs & gift vouchers"
        subtitle="Adjustments retain a reason in the activity log."
        action={
          admin ? (
            <button className="ad-button" onClick={() => open("pack-new")}>
              <Icon name="plus" size={16} />
              Issue sample pack
            </button>
          ) : (
            <Badge>View only</Badge>
          )
        }
      >
        <Table
          headers={[
            "Reference",
            "Guest",
            "Product",
            "Remaining",
            "Expires",
            "Action",
          ]}
          rows={packs.map((p) => [
            p.id,
            p.guest,
            p.name,
            `${p.balance.toLocaleString()} ${p.unit}`,
            p.expires,
            admin ? (
              <button
                key="a"
                className="ad-row-button"
                onClick={() => open("pack", p.id)}
              >
                Adjust balance
              </button>
            ) : (
              <span key="v" className="ad-muted">
                Read only
              </span>
            ),
          ])}
        />
      </Panel>
    )
  }
  function invoiceView() {
    return (
      <Panel
        title="Corporate invoices"
        subtitle="Drafts and tracking only. Nothing is emailed or charged."
        action={
          <button className="ad-button" onClick={() => open("invoice-new")}>
            <Icon name="plus" size={16} />
            New invoice
          </button>
        }
      >
        <Table
          headers={["Invoice", "Company", "Amount", "Status", "Action"]}
          rows={invoices.map((i) => [
            i.id,
            i.company,
            money(i.amount),
            <Badge key="s">{i.status}</Badge>,
            <button
              key="a"
              className="ad-row-button"
              onClick={() => open("invoice", i.id)}
            >
              Review
            </button>,
          ])}
        />
      </Panel>
    )
  }
  function inboxView() {
    return (
      <Panel
        title="Guest enquiries"
        subtitle="Sample messages. Replies are saved as drafts only."
      >
        <div className="ad-message-list">
          {messages.map((m) => (
            <button key={m.id} onClick={() => open("message", m.id)}>
              <span className="ad-avatar">{m.name[0]}</span>
              <span>
                <strong>{m.subject}</strong>
                <small>
                  {m.name} · {m.text}
                </small>
              </span>
              <Badge>{m.status}</Badge>
            </button>
          ))}
        </div>
      </Panel>
    )
  }
  function contentView() {
    return (
      <>
        <div className="ad-callout">
          <Icon name="content" />
          <p>
            Try editing a draft and previewing it. Public website content is not
            changed by this prototype.
          </p>
        </div>
        <div className="ad-content-grid">
          {content.map((c) => (
            <section className="ad-panel ad-content-card" key={c.id}>
              <div className="ad-content-preview">
                <span className="ad-eyebrow">AMARI · {c.name}</span>
                <h2>{c.title}</h2>
                <p>{c.body}</p>
              </div>
              <div className="ad-content-meta">
                <div>
                  <strong>{c.name}</strong>
                  <Badge>{c.status}</Badge>
                </div>
                <button
                  className="ad-row-button"
                  onClick={() => open("content", c.id)}
                >
                  Edit draft
                </button>
              </div>
            </section>
          ))}
        </div>
        <Panel
          title="Photography direction"
          subtitle="Approved media will replace the current placeholders."
        >
          <div className="ad-padded">
            <p>
              Private suite · Chair details · Reading lounge · Arrival and
              reception
            </p>
            <p className="ad-muted">
              Use consistent warm daylight, natural materials, and photographs
              of the actual space. No media uploads or publishing are connected
              in this preview.
            </p>
          </div>
        </Panel>
      </>
    )
  }
  function reportsView() {
    const multiplier = period === "Today" ? 1 : period === "7 days" ? 6 : 24
    return (
      <>
        <div className="ad-report-filter">
          <span>Reporting period</span>
          <div className="ad-segment">
            {["Today", "7 days", "30 days"].map((p) => (
              <button
                key={p}
                aria-pressed={period === p}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <span className="ad-muted">
            Illustrative {period.toLowerCase()} figures
          </span>
        </div>
        <div className="ad-finance-summary">
          <div>
            <span>Sample collections</span>
            <strong>{money(totalCollected * multiplier)}</strong>
          </div>
          <div>
            <span>Paid transactions</span>
            <strong>{payments.filter(collected).length * multiplier}</strong>
          </div>
          <div>
            <span>Refunded value</span>
            <strong>
              {money(
                payments
                  .filter((p) => p.status === "Refunded")
                  .reduce((a, p) => a + p.amount, 0) * multiplier,
              )}
            </strong>
          </div>
        </div>
        <div className="ad-main-grid">
          <Panel
            title="Collections by payment method"
            subtitle="Current sample register · Pack credits excluded"
          >
            <div className="ad-bars">
              {[
                "MTN MoMo",
                "Airtel Money",
                "Visa",
                "Mastercard",
                "Bank transfer",
              ].map((method) => {
                const value = payments
                  .filter((p) => p.method === method && collected(p))
                  .reduce((a, p) => a + p.amount, 0)
                return (
                  <div key={method}>
                    <div>
                      <span>{method}</span>
                      <strong>{money(value * multiplier)}</strong>
                    </div>
                    <meter
                      min={0}
                      max={Math.max(totalCollected, 1)}
                      value={value}
                      aria-label={`${method} share of collections`}
                    />
                  </div>
                )
              })}
            </div>
          </Panel>
          <Panel
            title="Make the numbers useful"
            subtitle="Clear definitions, no double counting."
          >
            <div className="ad-padded ad-definition">
              <h3>Collections</h3>
              <p>
                Successful payments less completed refunds. Pack redemptions do
                not create new cash collections.
              </p>
              <h3>Period preview</h3>
              <p>
                Week and month views scale the sample day to demonstrate the
                interface. They are not historical reports.
              </p>
              <button
                className="ad-button ad-button--secondary"
                onClick={() => {
                  go("payments")
                }}
              >
                Inspect transactions
              </button>
            </div>
          </Panel>
        </div>
        {admin && (
          <Panel title="Operations snapshot" subtitle="The current sample day">
            <div className="ad-finance-summary ad-summary-inner">
              <div>
                <span>Completed sessions</span>
                <strong>
                  {bookings.filter((b) => b.status === "Completed").length}
                </strong>
              </div>
              <div>
                <span>Available suites</span>
                <strong>
                  {suites.filter((s) => s.status === "Ready").length}
                </strong>
              </div>
              <div>
                <span>Maintenance blocks</span>
                <strong>
                  {suites.filter((s) => s.status === "Maintenance").length}
                </strong>
              </div>
            </div>
          </Panel>
        )}
      </>
    )
  }
  function activityList(limit?: number) {
    const items = activities.filter((a) => admin || a.finance).slice(0, limit)
    return (
      <ul className="ad-activity-list">
        {items.map((a, i) => (
          <li key={a.id}>
            <span className="ad-activity-dot" />
            <div>
              <strong>{a.text}</strong>
              <small>
                {a.role} ·{" "}
                {i === 0 ? "Latest action" : "Earlier in this preview"}
              </small>
            </div>
          </li>
        ))}
      </ul>
    )
  }
  function teamView() {
    return (
      <>
        <Panel
          title="Your team"
          subtitle="One Superadmin. An optional Finance account."
        >
          <Table
            headers={["Account", "Role", "Access", "Status"]}
            rows={[
              [
                "Owner preview",
                <Badge key="r">Superadmin</Badge>,
                "Everything",
                <Badge key="s">Active</Badge>,
              ],
              [
                accountName,
                <Badge key="r">Finance</Badge>,
                "Financial records & booking references",
                <Badge key="s">
                  {financeEnabled ? "Active" : "Suspended"}
                </Badge>,
              ],
            ]}
          />
          <div className="ad-padded">
            <button
              className="ad-button ad-button--secondary"
              onClick={() => {
                setFinanceEnabled(!financeEnabled)
                record(
                  `Finance preview ${financeEnabled ? "suspended" : "enabled"}`,
                )
              }}
            >
              {financeEnabled
                ? "Suspend Finance preview"
                : "Enable Finance preview"}
            </button>
          </div>
        </Panel>
        <Panel
          title="Access at a glance"
          subtitle="Role visibility is simulated, not a security boundary."
        >
          <Table
            headers={["Capability", "Superadmin", "Finance"]}
            rows={[
              [
                "Bookings & operations",
                "Full control",
                "Booking references only",
              ],
              [
                "Payments & reconciliation",
                "Full control",
                "Review & reconcile",
              ],
              ["Refunds", "Approve & process", "Request approval"],
              ["Packs & vouchers", "Create & adjust", "View balances"],
              ["Corporate invoices", "Full control", "Create & manage"],
              [
                "Website, users & business settings",
                "Full control",
                "No access",
              ],
            ]}
          />
        </Panel>
      </>
    )
  }
  function settingsView() {
    return (
      <Panel
        title={admin ? "Business preferences" : "Your account"}
        subtitle="Changes apply within this preview only."
      >
        <form
          className="ad-form ad-padded"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            if (admin) {
              const next = {
                name: String(f.get("name")).trim(),
                location: String(f.get("location")).trim(),
                open: String(f.get("open")),
                close: String(f.get("close")),
                turnover: Number(f.get("turnover")),
                cancellation: Number(f.get("cancellation")),
              }
              if (next.open >= next.close) {
                setToast("Closing time must be later than opening time.")
                return
              }
              setSettings(next)
              record("Updated business preferences")
            } else {
              setAccountName(String(f.get("name")).trim())
              record("Updated Finance display name", true)
            }
          }}
        >
          <div className="ad-form-grid">
            <Field label={admin ? "Business name" : "Display name"}>
              <input
                required
                name="name"
                defaultValue={admin ? settings.name : accountName}
                maxLength={60}
              />
            </Field>
            {admin && (
              <>
                <Field label="Location">
                  <input
                    required
                    name="location"
                    defaultValue={settings.location}
                    maxLength={100}
                  />
                </Field>
                <Field label="Weekday opening">
                  <input
                    required
                    name="open"
                    type="time"
                    defaultValue={settings.open}
                  />
                </Field>
                <Field label="Weekday closing">
                  <input
                    required
                    name="close"
                    type="time"
                    defaultValue={settings.close}
                  />
                </Field>
                <Field label="Turnover (minutes)">
                  <input
                    required
                    name="turnover"
                    type="number"
                    min={5}
                    max={60}
                    defaultValue={settings.turnover}
                  />
                </Field>
                <Field label="Free cancellation window (hours)">
                  <input
                    required
                    name="cancellation"
                    type="number"
                    min={0}
                    max={72}
                    defaultValue={settings.cancellation}
                  />
                </Field>
              </>
            )}
          </div>
          <button className="ad-button">Save preview settings</button>
          <p className="ad-muted">
            Account credentials, provider keys, and live authentication are
            intentionally outside this design preview.
          </p>
        </form>
      </Panel>
    )
  }
  function dialogContent() {
    if (!modal) return null
    if (modal.type === "search")
      return (
        <>
          <label className="ad-search ad-dialog-search">
            <Icon name="search" />
            <input
              autoFocus
              placeholder="Search guest or booking reference"
              aria-label="Search all bookings"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="ad-search-results">
            {bookings
              .filter((b) =>
                `${b.guest} ${b.id}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((b) => (
                <button key={b.id} onClick={() => open("booking", b.id)}>
                  <strong>{b.guest}</strong>
                  <span>
                    {b.id} · {b.time}
                  </span>
                  <Badge>{b.status}</Badge>
                </button>
              ))}
          </div>
          {!bookings.some((b) =>
            `${b.guest} ${b.id}`.toLowerCase().includes(query.toLowerCase()),
          ) && <Empty />}
        </>
      )
    if (modal.type === "notifications")
      return (
        <div className="ad-form">
          <p>Items requiring attention in this sample workspace.</p>
          <button
            className="ad-button ad-button--secondary"
            onClick={() => {
              go("payments")
              setFilter("Pending")
            }}
          >
            {payments.filter((p) => p.status === "Pending").length} pending
            payment
          </button>
          <button
            className="ad-button ad-button--secondary"
            onClick={() => {
              go("payments")
              setFilter("Refund requested")
            }}
          >
            {refunds.length} refund requests
          </button>
          {admin && (
            <button
              className="ad-button ad-button--secondary"
              onClick={() => go("suites")}
            >
              Review suite readiness
            </button>
          )}
        </div>
      )
    if (modal.type === "booking" && selectedBooking) {
      const b = selectedBooking
      const payment = payments.find((p) => p.booking === b.id)
      const suite = suites.find((s) => s.id === b.suite)
      return (
        <>
          <div className="ad-detail-title">
            <span className="ad-avatar ad-avatar--large">{b.guest[0]}</span>
            <div>
              <h3>{b.guest}</h3>
              <p>{b.id} · 18 September 2026</p>
            </div>
            <Badge>{b.status}</Badge>
          </div>
          <dl className="ad-detail-grid">
            <div>
              <dt>Session</dt>
              <dd>{b.duration} minutes</dd>
            </div>
            <div>
              <dt>Arrival</dt>
              <dd>{b.time} CAT</dd>
            </div>
            <div>
              <dt>Suite</dt>
              <dd>Suite {b.suite}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>{payment?.status ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{money(b.amount)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>Sample website booking</dd>
            </div>
          </dl>
          <div className="ad-actions">
            {payment && (
              <button
                className="ad-button ad-button--secondary"
                onClick={() => open("payment", payment.id)}
              >
                View transaction
              </button>
            )}
            {admin && b.status === "Confirmed" && (
              <button
                className="ad-button"
                onClick={() => updateBooking(b, "Checked in")}
              >
                Check in guest
              </button>
            )}
            {admin && b.status === "Checked in" && (
              <button
                className="ad-button"
                disabled={suite?.status !== "Ready"}
                onClick={() => updateBooking(b, "In session")}
              >
                Start session
              </button>
            )}
            {admin && b.status === "In session" && (
              <button
                className="ad-button"
                onClick={() => updateBooking(b, "Completed")}
              >
                Complete session
              </button>
            )}
            {admin && ["Confirmed", "Awaiting payment"].includes(b.status) && (
              <>
                <button
                  className="ad-button ad-button--secondary"
                  onClick={() => open("reschedule", b.id)}
                >
                  Reschedule
                </button>
                <button
                  className="ad-button ad-button--danger"
                  onClick={() => open("cancel", b.id)}
                >
                  Cancel booking
                </button>
              </>
            )}
          </div>
          {admin && b.status === "Checked in" && suite?.status !== "Ready" && (
            <p className="ad-inline-note">
              The suite must be marked Ready before this session can start.
            </p>
          )}
        </>
      )
    }
    if ((modal.type === "new-booking" || modal.type === "reschedule") && admin)
      return (
        <form className="ad-form" onSubmit={saveBooking}>
          <Field label="Guest name">
            <input
              name="guest"
              required
              maxLength={80}
              defaultValue={selectedBooking?.guest}
              readOnly={Boolean(selectedBooking)}
              placeholder="Sample guest name"
            />
          </Field>
          <div className="ad-form-grid">
            <Field label="Session">
              <select
                name="duration"
                defaultValue={selectedBooking?.duration ?? 30}
                disabled={Boolean(selectedBooking)}
              >
                {[15, 30, 60].map((n) => (
                  <option value={n} key={n}>
                    {n} minutes
                  </option>
                ))}
              </select>
              {selectedBooking && (
                <input
                  type="hidden"
                  name="duration"
                  value={selectedBooking.duration}
                />
              )}
            </Field>
            <Field label="Start time · sample day">
              <input
                type="time"
                name="time"
                defaultValue={selectedBooking?.time ?? "18:00"}
                required
              />
            </Field>
            <Field label="Suite">
              <select name="suite" defaultValue={selectedBooking?.suite ?? 3}>
                {suites.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    disabled={s.status === "Maintenance"}
                  >
                    {s.name}
                    {s.status === "Maintenance" ? " · unavailable" : ""}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input readOnly value="18 September 2026 · sample day" />
            </Field>
          </div>
          <p className="ad-muted">
            New bookings use standard sample rates and start Awaiting payment.
            Overlapping sessions and turnover are blocked.
          </p>
          {error && (
            <p role="alert" className="ad-error">
              {error}
            </p>
          )}
          <button className="ad-button">
            {selectedBooking ? "Save new time" : "Create sample booking"}
          </button>
        </form>
      )
    if (modal.type === "cancel" && selectedBooking && admin)
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const reason = String(
              new FormData(e.currentTarget).get("reason"),
            ).trim()
            if (!reason) return
            record(`Cancellation reason for ${selectedBooking.id}: ${reason}`)
            updateBooking(selectedBooking, "Cancelled")
          }}
        >
          <p>
            Cancel {selectedBooking.guest}’s sample booking? Payment refunds are
            managed separately in Payments.
          </p>
          <Field label="Reason">
            <textarea name="reason" required maxLength={300} />
          </Field>
          <button className="ad-button ad-button--danger">
            Cancel sample booking
          </button>
        </form>
      )
    if (modal.type === "payment" && selectedPayment) {
      const p = selectedPayment
      return (
        <>
          <dl className="ad-detail-grid">
            <div>
              <dt>Reference</dt>
              <dd>{p.id}</dd>
            </div>
            <div>
              <dt>Guest</dt>
              <dd>{p.guest}</dd>
            </div>
            <div>
              <dt>Amount</dt>
              <dd>{money(p.amount)}</dd>
            </div>
            <div>
              <dt>Method</dt>
              <dd>{p.method}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <Badge>{p.status}</Badge>
              </dd>
            </div>
            <div>
              <dt>Reconciliation</dt>
              <dd>{p.reconciled ? "Matched in preview" : "Not matched"}</dd>
            </div>
          </dl>
          {p.reason && <p className="ad-callout">Refund reason: {p.reason}</p>}
          <div className="ad-actions">
            {collected(p) && !p.reconciled && (
              <button
                className="ad-button"
                onClick={() => {
                  setPayments((all) =>
                    all.map((x) =>
                      x.id === p.id ? { ...x, reconciled: true } : x,
                    ),
                  )
                  record(`Reconciled ${p.id}`, true)
                }}
              >
                Mark reconciled
              </button>
            )}
            {p.status === "Paid" && (
              <button
                className="ad-button ad-button--secondary"
                onClick={() => open("refund", p.id)}
              >
                Request refund
              </button>
            )}
            {p.status === "Refund requested" && admin && (
              <>
                <button
                  className="ad-button"
                  onClick={() => {
                    setPayments((all) =>
                      all.map((x) =>
                        x.id === p.id
                          ? { ...x, status: "Refunded", reconciled: false }
                          : x,
                      ),
                    )
                    record(`Approved sample refund ${p.id}`, true)
                    close()
                  }}
                >
                  Approve sample refund
                </button>
                <button
                  className="ad-button ad-button--secondary"
                  onClick={() => {
                    setPayments((all) =>
                      all.map((x) =>
                        x.id === p.id ? { ...x, status: "Paid" } : x,
                      ),
                    )
                    record(`Declined refund ${p.id}`, true)
                    close()
                  }}
                >
                  Decline request
                </button>
              </>
            )}
            {p.status === "Pending" && admin && (
              <button
                className="ad-button"
                onClick={() => {
                  setPayments((all) =>
                    all.map((x) =>
                      x.id === p.id ? { ...x, status: "Paid" } : x,
                    ),
                  )
                  setBookings((all) =>
                    all.map((b) =>
                      b.id === p.booking && b.status === "Awaiting payment"
                        ? { ...b, status: "Confirmed" }
                        : b,
                    ),
                  )
                  record(`Simulated successful payment ${p.id}`, true)
                }}
              >
                Simulate payment received
              </button>
            )}
          </div>
          <p className="ad-muted">
            No provider is connected. Reconciliation and refunds here only
            update fictional records.
            {!admin && p.status === "Refund requested"
              ? " Superadmin approval is required."
              : ""}
          </p>
        </>
      )
    }
    if (modal.type === "refund" && selectedPayment)
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const reason = String(
              new FormData(e.currentTarget).get("reason"),
            ).trim()
            if (!reason) return
            setPayments((all) =>
              all.map((p) =>
                p.id === selectedPayment.id
                  ? { ...p, status: "Refund requested", reason }
                  : p,
              ),
            )
            record(
              `Requested ${money(selectedPayment.amount)} refund for ${selectedPayment.id}`,
              true,
            )
            close()
          }}
        >
          <p>
            Request a full refund of{" "}
            <strong>{money(selectedPayment.amount)}</strong> for{" "}
            {selectedPayment.guest}. Superadmin will review the request.
          </p>
          <Field label="Reason for refund">
            <textarea name="reason" required maxLength={300} />
          </Field>
          <button className="ad-button">Submit sample request</button>
        </form>
      )
    if (modal.type === "suite" && admin) {
      const suite = suites.find((s) => String(s.id) === modal.id)
      if (!suite) return null
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            const status = String(f.get("status"))
            setSuites((all) =>
              all.map((s) =>
                s.id === suite.id
                  ? {
                      ...s,
                      status,
                      note:
                        String(f.get("note")).trim() || "Updated in preview",
                    }
                  : s,
              ),
            )
            record(`${suite.name} marked ${status.toLowerCase()}`)
            close()
          }}
        >
          <Badge>{suite.status}</Badge>
          {suite.status === "Occupied" ? (
            <p>
              Complete the active session from Bookings before changing this
              room’s status.
            </p>
          ) : (
            <>
              <Field label="Room status">
                <select
                  name="status"
                  defaultValue={
                    suite.status === "Cleaning" ? "Ready" : suite.status
                  }
                >
                  <option>Ready</option>
                  <option>Cleaning</option>
                  <option>Maintenance</option>
                </select>
              </Field>
              {suite.status === "Cleaning" && (
                <fieldset className="ad-checklist">
                  <legend>Turnover checklist</legend>
                  {[
                    "Fresh cover and headrest cloth",
                    "Contact surfaces cleaned",
                    "Room aired and checked",
                  ].map((label) => (
                    <label key={label}>
                      <input type="checkbox" required />
                      {label}
                    </label>
                  ))}
                </fieldset>
              )}
              <Field label="Room note">
                <textarea
                  name="note"
                  defaultValue={suite.note}
                  maxLength={300}
                />
              </Field>
              <button className="ad-button">Save room status</button>
            </>
          )}
        </form>
      )
    }
    if (modal.type === "guest" && admin) {
      const guest = modal.id
      return (
        <>
          <div className="ad-detail-title">
            <span className="ad-avatar ad-avatar--large">{guest?.[0]}</span>
            <div>
              <h3>{guest}</h3>
              <p>Fictional guest · No personal contact data</p>
            </div>
          </div>
          <h3>Bookings</h3>
          <Table
            headers={["Reference", "Time", "Status"]}
            rows={bookings
              .filter((b) => b.guest === guest)
              .map((b) => [b.id, b.time, <Badge key="s">{b.status}</Badge>])}
          />
          <h3>Active balances</h3>
          {packs.some((p) => p.guest === guest) ? (
            packs
              .filter((p) => p.guest === guest)
              .map((p) => (
                <p key={p.id}>
                  {p.name} · {p.balance} {p.unit}
                </p>
              ))
          ) : (
            <p className="ad-muted">No active packs in the sample data.</p>
          )}
        </>
      )
    }
    if ((modal.type === "pack" || modal.type === "pack-new") && admin)
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            const balance = Number(f.get("balance")),
              reason = String(f.get("reason")).trim()
            if (selectedPack) {
              setPacks((all) =>
                all.map((p) =>
                  p.id === selectedPack.id ? { ...p, balance } : p,
                ),
              )
              record(
                `Adjusted ${selectedPack.id} from ${selectedPack.balance} to ${balance} ${selectedPack.unit}: ${reason}`,
                true,
              )
            } else {
              const unit = String(f.get("unit"))
              setPacks((all) => [
                ...all,
                {
                  id: `PK-${Date.now().toString().slice(-6)}`,
                  guest: String(f.get("guest")).trim(),
                  name: unit === "RWF" ? "Gift voucher" : "Sample session pack",
                  balance,
                  unit,
                  expires: "18 Dec 2026",
                },
              ])
              record(
                `Issued sample ${
                  unit === "RWF" ? "voucher" : "pack"
                }: ${reason}`,
                true,
              )
            }
            close()
          }}
        >
          {!selectedPack && (
            <>
              <Field label="Guest">
                <input name="guest" required maxLength={80} />
              </Field>
              <Field label="Balance type">
                <select name="unit">
                  <option value="sessions">Session credits</option>
                  <option value="RWF">Gift voucher value (RWF)</option>
                </select>
              </Field>
            </>
          )}
          <Field
            label={`New balance${
              selectedPack ? ` (${selectedPack.unit})` : ""
            }`}
          >
            <input
              type="number"
              required
              min={0}
              max={10000000}
              step={1}
              name="balance"
              defaultValue={selectedPack?.balance ?? 5}
            />
          </Field>
          <Field label="Reason">
            <textarea name="reason" required maxLength={300} />
          </Field>
          <button className="ad-button">Save sample balance</button>
        </form>
      )
    if (modal.type === "invoice-new")
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            setInvoices((all) => [
              ...all,
              {
                id: `INV-${Date.now().toString().slice(-6)}`,
                company: String(f.get("company")).trim(),
                amount: Number(f.get("amount")),
                status: "Draft",
              },
            ])
            record("Created sample invoice draft", true)
            close()
          }}
        >
          <Field label="Company name">
            <input name="company" required maxLength={100} />
          </Field>
          <Field label="Invoice amount (RWF)">
            <input
              type="number"
              min={1}
              max={100000000}
              step={1}
              required
              name="amount"
            />
          </Field>
          <p className="ad-muted">
            Draft only. No invoice or payment request is sent.
          </p>
          <button className="ad-button">Create draft</button>
        </form>
      )
    if (modal.type === "invoice" && selectedInvoice)
      return (
        <>
          <div className="ad-invoice-preview">
            <p className="ad-eyebrow">AMARI · SAMPLE INVOICE</p>
            <h3>{selectedInvoice.id}</h3>
            <p>{selectedInvoice.company}</p>
            <strong>{money(selectedInvoice.amount)}</strong>
            <Badge>{selectedInvoice.status}</Badge>
          </div>
          <div className="ad-actions">
            {selectedInvoice.status === "Draft" && (
              <button
                className="ad-button"
                onClick={() => {
                  setInvoices((all) =>
                    all.map((i) =>
                      i.id === selectedInvoice.id
                        ? { ...i, status: "Outstanding" }
                        : i,
                    ),
                  )
                  record(
                    `Marked ${selectedInvoice.id} outstanding in preview`,
                    true,
                  )
                }}
              >
                Simulate issue
              </button>
            )}
            {selectedInvoice.status === "Outstanding" && (
              <button
                className="ad-button"
                onClick={() => {
                  setInvoices((all) =>
                    all.map((i) =>
                      i.id === selectedInvoice.id
                        ? { ...i, status: "Paid" }
                        : i,
                    ),
                  )
                  setPayments((all) => [
                    ...all,
                    {
                      id: `TX-${Date.now().toString().slice(-6)}`,
                      guest: selectedInvoice.company,
                      booking: selectedInvoice.id,
                      amount: selectedInvoice.amount,
                      method: "Bank transfer",
                      status: "Paid",
                      reconciled: false,
                    },
                  ])
                  record(
                    `Recorded sample invoice payment ${selectedInvoice.id}`,
                    true,
                  )
                }}
              >
                Simulate payment
              </button>
            )}
          </div>
          <p className="ad-muted">
            Invoice actions are simulated. Nothing is sent to this company.
          </p>
        </>
      )
    if (modal.type === "message" && selectedMessage && admin)
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const draft = String(new FormData(e.currentTarget).get("reply"))
            setMessages((all) =>
              all.map((m) =>
                m.id === selectedMessage.id
                  ? { ...m, status: "Draft reply", draft }
                  : m,
              ),
            )
            record(`Saved reply draft for ${selectedMessage.name}`)
            close()
          }}
        >
          <p className="ad-eyebrow">{selectedMessage.name}</p>
          <h3>{selectedMessage.subject}</h3>
          <p>{selectedMessage.text}</p>
          <Field label="Reply draft">
            <textarea
              name="reply"
              required
              defaultValue={selectedMessage.draft}
              maxLength={2000}
              placeholder="Write a thoughtful reply…"
            />
          </Field>
          <div className="ad-actions">
            <button className="ad-button">Save draft · not sent</button>
            <button
              type="button"
              className="ad-button ad-button--secondary"
              onClick={() => {
                setMessages((all) =>
                  all.map((m) =>
                    m.id === selectedMessage.id
                      ? { ...m, status: "Resolved" }
                      : m,
                  ),
                )
                record(`Resolved enquiry from ${selectedMessage.name}`)
                close()
              }}
            >
              Mark resolved
            </button>
          </div>
        </form>
      )
    if (modal.type === "content" && selectedContent && admin)
      return (
        <form
          className="ad-form"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            setContent((all) =>
              all.map((c) =>
                c.id === selectedContent.id
                  ? {
                      ...c,
                      title: String(f.get("title")),
                      body: String(f.get("body")),
                      status: "Draft",
                    }
                  : c,
              ),
            )
            record(`Saved ${selectedContent.name.toLowerCase()} preview draft`)
            close()
          }}
        >
          <Field label="Page headline">
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={selectedContent.title}
            />
          </Field>
          <Field label="Introduction">
            <textarea
              name="body"
              required
              maxLength={600}
              defaultValue={selectedContent.body}
            />
          </Field>
          <p className="ad-muted">
            The card in this workspace previews your draft. This does not edit
            or publish the public site.
          </p>
          <button className="ad-button">Save & preview draft</button>
        </form>
      )
    return (
      <Empty
        text="This action is not available for this role."
        detail="Close this panel to return to your workspace."
      />
    )
  }
  const dialogTitles: Record<string, string> = {
    search: "Find a booking",
    notifications: "Your attention list",
    booking: "Booking details",
    "new-booking": "Create a booking",
    reschedule: "Choose another time",
    cancel: "Cancel this booking",
    payment: "Transaction details",
    refund: "Request a refund",
    suite: "Suite preparation",
    guest: "Guest profile",
    pack: "Adjust a balance",
    "pack-new": "Issue a pack or voucher",
    "invoice-new": "New corporate invoice",
    invoice: "Invoice details",
    message: "Guest enquiry",
    content: "Edit a content draft",
  }
  if (!signedIn)
    return (
      <div className="admin-app ad-login">
        <main id="main-content" className="ad-login-box">
          <a href="/">
            <img src="/amari-horizontal.svg" alt="Amari" />
          </a>
          <p className="ad-eyebrow">THE AMARI WORKSPACE</p>
          <h1>
            A calmer way
            <br />
            to run the day.
          </h1>
          <p>
            Choose a role to explore the dashboard. No password or real account
            is needed for this design preview.
          </p>
          <div className="ad-login-roles">
            {(["Superadmin", "Finance"] as Role[]).map((r) => (
              <button
                key={r}
                className={role === r ? "selected" : ""}
                aria-pressed={role === r}
                disabled={r === "Finance" && !financeEnabled}
                onClick={() => setRole(r)}
              >
                <Icon name={r === "Superadmin" ? "team" : "payments"} />
                <span>
                  <strong>{r}</strong>
                  <small>
                    {r === "Superadmin"
                      ? "Full workspace access"
                      : "Payments, invoices & reporting"}
                  </small>
                </span>
                <span aria-hidden="true">{role === r ? "✓" : "○"}</span>
              </button>
            ))}
          </div>
          <button
            className="ad-button"
            onClick={() => {
              setSignedIn(true)
              setSection("overview")
            }}
          >
            Enter {role} preview
          </button>
          <small className="ad-login-note">
            Sample data only · No backend or real authentication
          </small>
          <a className="ad-text-button" href="/">
            Back to the website
          </a>
        </main>
      </div>
    )
  return (
    <div className="admin-app">
      <aside className="ad-sidebar">
        <a className="ad-brand" href="/">
          <img src="/amari-horizontal.svg" alt="Amari home" />
        </a>
        <div className="ad-workspace-label">
          <span className="ad-live-dot" />
          THE WORKSPACE
        </div>
        <nav aria-label="Admin navigation">
          {["Workspace", "Business", "Manage"].map((group) => (
            <div className="ad-nav-group" key={group}>
              <p>{group}</p>
              {navigation
                .filter((n) => n.group === group && canView(n.id))
                .map((n) => (
                  <button
                    key={n.id}
                    className={section === n.id ? "active" : ""}
                    aria-current={section === n.id ? "page" : undefined}
                    onClick={() => go(n.id)}
                  >
                    <Icon name={n.id} />
                    <span>{n.label}</span>
                    {n.id === "inbox" && (
                      <small>
                        {messages.filter((m) => m.status === "New").length}
                      </small>
                    )}
                  </button>
                ))}
            </div>
          ))}
        </nav>
        <div className="ad-sidebar-bottom">
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Icon name="external" size={17} />
            View website
          </a>
          <button
            onClick={() => {
              setSignedIn(false)
              setModal(null)
            }}
          >
            <Icon name="logout" size={17} />
            Leave preview
          </button>
          <p>Amari · Kimihurura, Kigali</p>
        </div>
      </aside>
      <div className="ad-workspace">
        <header className="ad-topbar">
          <div className="ad-breadcrumb">
            <button
              className="ad-icon-button ad-mobile-toggle"
              aria-label="Open workspace menu"
              onClick={() => setMobileOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <span className="ad-divider">/</span>
            <strong>{pageTitle}</strong>
          </div>
          <div className="ad-top-actions">
            <button
              className="ad-icon-button"
              aria-label="Search bookings"
              onClick={() => {
                setQuery("")
                open("search")
              }}
            >
              <Icon name="search" />
            </button>
            <button
              className="ad-icon-button ad-notification"
              aria-label="View notifications"
              onClick={() => open("notifications")}
            >
              <Icon name="bell" />
              <span />
            </button>
            <div className="ad-role">
              <span className="ad-avatar">{admin ? "SA" : "FI"}</span>
              <label>
                <span>Preview as</span>
                <select
                  aria-label="Preview role"
                  value={role}
                  onChange={(e) => changeRole(e.target.value as Role)}
                >
                  <option>Superadmin</option>
                  <option disabled={!financeEnabled}>Finance</option>
                </select>
              </label>
            </div>
          </div>
        </header>
        <div className="ad-preview-strip">
          <span>
            <span className="ad-live-dot" /> Design preview
          </span>
          <p>Fictional data. Actions stay in this tab and reset on refresh.</p>
          <span className="ad-preview-date">18 Sep 2026 · CAT</span>
        </div>
        <main id="main-content" className="ad-main">
          <div className="ad-page-head">
            <div>
              <p className="ad-eyebrow">
                {section === "overview"
                  ? "FRIDAY, 18 SEPTEMBER"
                  : "AMARI WORKSPACE"}
              </p>
              <h1 tabIndex={-1} ref={headingRef}>
                {section === "overview"
                  ? admin
                    ? "A good day starts here."
                    : "Your finances, in focus."
                  : pageTitle}
              </h1>
              <p>{descriptions[section]}</p>
            </div>
            <div className="ad-page-actions">
              {["payments", "reports", "invoices", "bookings"].includes(
                section,
              ) && (
                <button
                  className="ad-button ad-button--secondary"
                  onClick={exportCsv}
                >
                  <Icon name="export" size={17} />
                  {section === "reports" ? "Export transaction CSV" : "Export CSV"}
                </button>
              )}
              {admin && ["overview", "bookings"].includes(section) && (
                <button
                  className="ad-button"
                  onClick={() => open("new-booking")}
                >
                  <Icon name="plus" size={18} />
                  New booking
                </button>
              )}
            </div>
          </div>
          {section === "overview" ? (
            overview()
          ) : section === "bookings" ? (
            bookingView()
          ) : section === "suites" && admin ? (
            suiteView()
          ) : section === "guests" && admin ? (
            guestsView()
          ) : section === "payments" ? (
            paymentsView()
          ) : section === "packs" ? (
            packsView()
          ) : section === "invoices" ? (
            invoiceView()
          ) : section === "inbox" && admin ? (
            inboxView()
          ) : section === "content" && admin ? (
            contentView()
          ) : section === "reports" ? (
            reportsView()
          ) : section === "team" && admin ? (
            teamView()
          ) : section === "settings" ? (
            settingsView()
          ) : section === "activity" ? (
            <Panel
              title={admin ? "Workspace activity" : "Finance activity"}
              subtitle="Changes recorded during this preview session."
            >
              {activityList()}
            </Panel>
          ) : (
            <Empty text="This view is not available." />
          )}
          <footer className="ad-footer">
            <span>A little clarity. Entirely yours.</span>
            <span>Amari workspace · Interactive prototype</span>
          </footer>
        </main>
      </div>
      {toast && (
        <div role="status" className="ad-toast">
          <Icon name="check" size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Dialog
          key={modal.type + modal.id}
          title={dialogTitles[modal.type] ?? "Preview"}
          onClose={close}
        >
          {dialogContent()}
        </Dialog>
      )}
      {mobileOpen && (
        <Dialog title="Your workspace" onClose={() => setMobileOpen(false)}>
          <nav className="ad-mobile-nav" aria-label="Mobile admin navigation">
            {navigation
              .filter((n) => canView(n.id))
              .map((n) => (
                <button
                  key={n.id}
                  aria-current={section === n.id ? "page" : undefined}
                  onClick={() => go(n.id)}
                >
                  <Icon name={n.id} />
                  {n.label}
                </button>
              ))}
            <button
              onClick={() => {
                setMobileOpen(false)
                setSignedIn(false)
              }}
            >
              <Icon name="logout" />
              Leave preview
            </button>
          </nav>
        </Dialog>
      )}
    </div>
  )
}
