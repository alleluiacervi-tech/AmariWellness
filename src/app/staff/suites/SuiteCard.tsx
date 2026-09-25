"use client"

/**
 * One suite: its editable name/status/note (only when the signed-in
 * staff member has `suites.edit` — Owner/Manager), and its maintenance
 * blocks (add/remove — anyone with `suites.maintenance`, which also
 * covers Front desk, since taking a chair out of service is a floor
 * decision, not a pricing one). See CLAUDE.md §3's role table.
 */

import { useActionState } from "react"
import { addMaintenanceBlock, deleteMaintenanceBlock, updateSuite, type ActionState } from "@/server/admin/actions"
import type { MaintenanceBlockRow, SuiteRow } from "@/server/db/content"

const initial: ActionState = {}

const STATUS_LABELS: Record<SuiteRow["status"], string> = {
  ready: "Ready",
  occupied: "Occupied",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
}

function formatBlockTime(d: Date) {
  return new Date(d).toLocaleString("en-RW", { dateStyle: "medium", timeStyle: "short" })
}

export default function SuiteCard({
  suite,
  blocks,
  canEdit,
}: {
  suite: SuiteRow
  blocks: MaintenanceBlockRow[]
  canEdit: boolean
}) {
  const [suiteState, suiteAction, suitePending] = useActionState(updateSuite, initial)
  const [blockState, blockAction, blockPending] = useActionState(addMaintenanceBlock, initial)

  return (
    <article className="form-card" aria-labelledby={`suite-${suite.id}-title`}>
      <div className="cluster justify-between">
        <h2 className="h3" id={`suite-${suite.id}-title`}>
          {suite.name}
        </h2>
        <span className="tag">{STATUS_LABELS[suite.status]}</span>
      </div>

      {canEdit ? (
        <form className="stack--tight" action={suiteAction}>
          <input type="hidden" name="id" value={suite.id} />
          <div className="form-grid">
            <label className="field">
              <span className="field__label">Name</span>
              <input className="input" name="name" defaultValue={suite.name} required maxLength={40} />
            </label>
            <label className="field">
              <span className="field__label">Status</span>
              <select className="input" name="status" defaultValue={suite.status}>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            <span className="field__label">Note</span>
            <input className="input" name="note" defaultValue={suite.note ?? ""} maxLength={200} />
          </label>
          {suiteState.error && (
            <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
              {suiteState.error}
            </p>
          )}
          {suiteState.ok && <p className="small">Saved.</p>}
          <button className="btn btn--outline btn--sm" type="submit" disabled={suitePending}>
            {suitePending ? "Saving…" : "Save suite"}
          </button>
        </form>
      ) : (
        suite.note && <p className="small">{suite.note}</p>
      )}

      <div className="stack--tight">
        <h3 className="h4">Maintenance blocks</h3>
        {blocks.length === 0 ? (
          <p className="meta">None scheduled.</p>
        ) : (
          <ul className="stack--tight" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {blocks.map((b) => (
              <li key={b.id} className="cluster justify-between">
                <span className="small">
                  <span className="font-mono">
                    {formatBlockTime(b.startAt)} → {formatBlockTime(b.endAt)}
                  </span>{" "}
                  — {b.reason}
                </span>
                <form action={deleteMaintenanceBlock.bind(null, b.id)}>
                  <button className="btn btn--outline btn--sm" type="submit">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <form className="form-grid" action={blockAction} style={{ alignItems: "end" }}>
          <input type="hidden" name="suiteId" value={suite.id} />
          <label className="field">
            <span className="field__label">Start</span>
            <input className="input" name="startAt" type="datetime-local" required />
          </label>
          <label className="field">
            <span className="field__label">End</span>
            <input className="input" name="endAt" type="datetime-local" required />
          </label>
          <label className="field">
            <span className="field__label">Reason</span>
            <input className="input" name="reason" required maxLength={200} placeholder="e.g. Chair repair" />
          </label>
          <div className="stack--tight">
            {blockState.error && (
              <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
                {blockState.error}
              </p>
            )}
            <button className="btn btn--outline btn--sm" type="submit" disabled={blockPending}>
              {blockPending ? "Adding…" : "Add block"}
            </button>
          </div>
        </form>
      </div>
    </article>
  )
}
