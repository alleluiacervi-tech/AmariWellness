"use client"

import { useActionState } from "react"
import { finishSessionAction, setSuiteFloorStatusAction, type ActionState } from "@/server/admin/floorActions"
import type { FloorSuite } from "@/server/checkin/floor"
import { formatKigaliTime } from "@/lib/kigaliTime"

const STATUS_LABELS: Record<FloorSuite["status"], string> = {
  ready: "Ready",
  occupied: "Occupied",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
}

const initial: ActionState = {}

/** One suite on the floor board: its state, who's in it, who's next, and the one or two moves the desk can make from here. */
export default function FloorSuiteRow({
  suite,
  canFinish,
  canSetStatus,
}: {
  suite: FloorSuite
  canFinish: boolean
  canSetStatus: boolean
}) {
  const [finishState, finishAction, finishPending] = useActionState(finishSessionAction, initial)
  const [statusState, statusAction, statusPending] = useActionState(setSuiteFloorStatusAction, initial)
  const error = finishState.error ?? statusState.error

  return (
    <li className="form-card" aria-labelledby={`floor-${suite.id}`}>
      <div className="cluster justify-between">
        <h3 className="h3" id={`floor-${suite.id}`}>
          {suite.name}
        </h3>
        <span className={suite.status === "ready" ? "tag" : "tag tag--outline"}>{STATUS_LABELS[suite.status]}</span>
      </div>

      {suite.note && <p className="meta">{suite.note}</p>}

      <div className="stack--tight">
        {suite.current ? (
          <p className="body">
            In now: {suite.current.clientName}, {suite.current.sessionName}, until{" "}
            <span className="font-mono">{formatKigaliTime(new Date(suite.current.sessionEndsAt))}</span>
          </p>
        ) : (
          <p className="meta">Nobody checked in.</p>
        )}
        {suite.next ? (
          <p className="body">
            Next: <span className="font-mono">{formatKigaliTime(new Date(suite.next.startAt))}</span> {suite.next.clientName},{" "}
            {suite.next.sessionName}
            {suite.stillToCome > 1 ? ` (${suite.stillToCome - 1} more after)` : ""}
          </p>
        ) : (
          <p className="meta">No more guests today.</p>
        )}
      </div>

      {error && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {error}
        </p>
      )}

      <div className="cluster">
        {canFinish && suite.current && (
          <form action={finishAction}>
            <input type="hidden" name="bookingId" value={suite.current.bookingId} />
            <button className="btn btn--outline btn--sm" type="submit" disabled={finishPending}>
              {finishPending ? "Finishing…" : "Session finished"}
            </button>
          </form>
        )}
        {/* An occupied suite with nobody checked in (their booking was cancelled mid-session) can be sent for cleaning too. */}
        {canSetStatus && (suite.status === "cleaning" || suite.status === "ready" || (suite.status === "occupied" && !suite.current)) && (
          <form action={statusAction}>
            <input type="hidden" name="suiteId" value={suite.id} />
            <input type="hidden" name="status" value={suite.status === "cleaning" ? "ready" : "cleaning"} />
            <button className={suite.status === "cleaning" ? "btn btn--sm" : "btn btn--outline btn--sm"} type="submit" disabled={statusPending}>
              {statusPending ? "Saving…" : suite.status === "cleaning" ? "Cleaned, mark ready" : "Needs cleaning"}
            </button>
          </form>
        )}
      </div>
    </li>
  )
}
