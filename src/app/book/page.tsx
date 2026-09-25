import { Suspense } from "react"
import BookingFlowFromParams, { BookingFlow } from "@/components/BookingFlow"
import { pageMetadata } from "@/lib/metadata"

export const metadata = pageMetadata({
  title: "Book a session",
  description:
    "Choose your session, day and time, and how you would like to pay. Private massage suites in Kimihurura, Kigali.",
  path: "/book",
})

export default function BookPage() {
  return (
    <main id="main-content" className="wrap booking">
      <div className="booking__head">
        <div className="booking__intro enter">
          <p className="label">A little time. Entirely yours.</p>
          <h1 className="h1">Book your quiet moment.</h1>
        </div>
        <div className="stack--tight items-start">
          <span className="tag tag--outline">Interactive design preview</span>
          <p className="meta max-w-[46ch]">
            Try it with sample details. No reservation, payment or message is
            sent.
          </p>
        </div>
      </div>
      {/* The server renders the flow with the default session; the
          URL's ?session= takes over once the page is interactive. */}
      <Suspense fallback={<BookingFlow />}>
        <BookingFlowFromParams />
      </Suspense>
    </main>
  )
}
