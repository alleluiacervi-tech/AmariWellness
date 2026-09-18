export default function Icon({
  name,
  size = 20,
}: {
  name: string
  size?: number
}) {
  const paths: Record<string, string> = {
    overview: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    bookings: "M4 5h16v16H4z M8 3v4 M16 3v4 M4 10h16 M8 14h2 M14 14h2 M8 17h2",
    suites:
      "M4 10V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5 M3 10h18v8H3z M5 18v3 M19 18v3 M8 7h8",
    guests:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M17 4a4 4 0 0 1 0 8 M18 15a4 4 0 0 1 4 4v2",
    payments: "M3 5h18v14H3z M3 10h18 M7 15h3",
    packs:
      "M3 8h18v4H3z M5 12v9h14v-9 M12 8v13 M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z",
    invoices: "M6 3h12v18l-3-2-3 2-3-2-3 2V3Z M9 7h6 M9 11h6 M9 15h4",
    reports: "M4 3v18h17 M8 16v-5 M13 16V7 M18 16v-9",
    inbox: "M3 5h18v14H3z M3 5l9 7 9-7",
    content: "M4 3h12l4 4v14H4z M16 3v5h4 M8 12h8 M8 16h5",
    team: "M12 3l8 4v6c0 4-8 8-8 8s-8-4-8-8V7l8-4Z M8 12l3 3 5-6",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2",
    activity: "M3 12a9 9 0 1 0 3-7 M3 3v6h6 M12 7v5l3 2",
    search: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6",
    plus: "M12 5v14 M5 12h14",
    close: "M6 6l12 12 M6 18 18 6",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    bell: "M6 9a6 6 0 0 1 12 0v6l2 3H4l2-3V9 M10 21h4",
    export: "M12 3v12 M8 11l4 4 4-4 M4 16v5h16v-5",
    check: "M5 12l4 4L19 6",
    external: "M14 3h7v7 M21 3 10 14 M10 3H3v18h18v-7",
    logout: "M9 3H3v18h6 M9 12h12 M17 8l4 4-4 4",
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.overview} />
    </svg>
  )
}
