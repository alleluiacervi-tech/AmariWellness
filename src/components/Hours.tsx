import { SITE_CONFIG } from "@/data/site"

const clock = (h: number) => `${String(h).padStart(2, "0")}:00`

/** Opening hours as a small table: days in words, times on the clock. */
export default function Hours({ className = "" }: { className?: string }) {
  const { weekday, weekend } = SITE_CONFIG.hours.schedule
  return (
    <dl className={`hours ${className}`}>
      <dt>Monday to Friday</dt>
      <dd>
        {clock(weekday.open)}–{clock(weekday.close)}
      </dd>
      <dt>Saturday and Sunday</dt>
      <dd>
        {clock(weekend.open)}–{clock(weekend.close)}
      </dd>
    </dl>
  )
}
