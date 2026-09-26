"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

/** Re-reads the page's server data on an interval, so a floor board left open at reception keeps up with check-ins made elsewhere and the scheduled jobs (no-shows, finished sessions) without anyone reloading. Pauses while the tab is hidden. */
export default function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter()
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh()
    }, seconds * 1000)
    return () => clearInterval(id)
  }, [router, seconds])
  return null
}
