import { Suspense } from "react"
import BookingFlow from "@/components/BookingFlow"

export const metadata = {
  title: "Book a session",
  description:
    "Explore the Amari booking experience. Choose your session, day, time, and payment method in this interactive preview.",
}

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookingFlow />
    </Suspense>
  )
}
