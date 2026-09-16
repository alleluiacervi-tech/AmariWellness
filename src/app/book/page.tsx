import { Suspense } from "react"
import BookingFlow from "@/components/BookingFlow"

export const metadata = {
  title: "Book a chair",
  description:
    "Choose a programme, a day and a time. Paid when you book, free cancellation up to four hours before.",
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookingFlow />
    </Suspense>
  )
}
