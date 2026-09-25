"use client"

/**
 * The desk's scanner (Phase 1.5). Two ways in, both ending at the same
 * preview: the device camera (decoded in the browser with jsQR, loaded
 * only when the camera is switched on), or the text field — which is
 * also where a USB or Bluetooth desk scanner "types" the code it reads,
 * followed by Enter. Nothing is checked in until someone taps the
 * button under the preview, and the server re-verifies the code then.
 */

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { checkInAction, lookupQrAction, type CheckInState } from "@/server/admin/floorActions"
import type { CheckInLookup } from "@/server/checkin/checkIn"
import { formatKigaliTime } from "@/lib/kigaliTime"

export default function CheckInPanel() {
  const [payload, setPayload] = useState("")
  const [lookup, setLookup] = useState<CheckInLookup | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [looking, startLookup] = useTransition()

  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function stopCamera() {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  useEffect(() => stopCamera, [])

  function handlePayload(value: string) {
    const code = value.trim()
    if (!code) return
    setPayload(code)
    setScanCount((n) => n + 1)
    startLookup(async () => {
      setLookup(await lookupQrAction(code))
    })
  }

  async function startCamera() {
    setCameraError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser can't open a camera here. Use the code field instead.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()
      const { default: jsQR } = await import("jsqr")
      setCameraOn(true)

      const canvas = canvasRef.current!
      const context = canvas.getContext("2d", { willReadFrequently: true })!
      const scan = () => {
        if (!streamRef.current) return
        if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
          // Decode a downscaled frame: a QR held up to the camera is
          // large, and full-resolution frames would starve slow devices.
          const scale = Math.min(1, 640 / video.videoWidth)
          canvas.width = Math.round(video.videoWidth * scale)
          canvas.height = Math.round(video.videoHeight * scale)
          context.drawImage(video, 0, 0, canvas.width, canvas.height)
          const image = context.getImageData(0, 0, canvas.width, canvas.height)
          const found = jsQR(image.data, image.width, image.height, { inversionAttempts: "dontInvert" })
          if (found?.data) {
            stopCamera()
            handlePayload(found.data)
            return
          }
        }
        frameRef.current = requestAnimationFrame(scan)
      }
      frameRef.current = requestAnimationFrame(scan)
    } catch {
      stopCamera()
      setCameraError("Couldn't open the camera — check the browser's camera permission, or use the code field.")
    }
  }

  function reset() {
    setLookup(null)
    setPayload("")
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  return (
    <div className="stack">
      <form
        className="stack--tight"
        onSubmit={(event) => {
          event.preventDefault()
          const value = String(new FormData(event.currentTarget).get("payload") ?? "")
          event.currentTarget.reset()
          handlePayload(value)
        }}
      >
        <label className="field">
          <span className="field__label">Scan or paste a booking code</span>
          <input
            ref={inputRef}
            className="input input--mono"
            name="payload"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            maxLength={500}
          />
          <span className="field__hint">A desk scanner types into this field. Or use the camera below.</span>
        </label>
        <div className="cluster">
          <button className="btn btn--sm" type="submit" disabled={looking}>
            {looking ? "Looking up…" : "Look up"}
          </button>
          {cameraOn ? (
            <button className="btn btn--outline btn--sm" type="button" onClick={stopCamera}>
              Stop camera
            </button>
          ) : (
            <button className="btn btn--outline btn--sm" type="button" onClick={startCamera}>
              Use camera
            </button>
          )}
        </div>
      </form>

      <video
        ref={videoRef}
        className="w-full max-w-sm rounded-[var(--r-md)]"
        hidden={!cameraOn}
        muted
        playsInline
        aria-label="Camera view for scanning a QR code"
      />
      <canvas ref={canvasRef} hidden />
      {cameraError && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {cameraError}
        </p>
      )}

      {lookup && !looking && <LookupResult key={scanCount} lookup={lookup} payload={payload} onDone={reset} />}
    </div>
  )
}

function LookupResult({ lookup, payload, onDone }: { lookup: CheckInLookup; payload: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<CheckInState, FormData>(checkInAction, {})
  const result = state.result ?? lookup
  const preview = result.preview
  const checkedIn = state.result?.ok === true

  return (
    <section className="form-card" aria-live="polite" aria-label="Scanned booking">
      {preview && (
        <div className="stack--tight">
          <p className="label">{checkedIn ? "Checked in" : result.ok ? "Ready to check in" : "Can't check in"}</p>
          <h3 className="h2">{preview.suiteName}</h3>
          <p className="lead">{preview.clientName}</p>
          <p className="body">
            {preview.sessionName}, <span className="font-mono">{preview.durationMinutes} min</span> at{" "}
            <span className="font-mono">{formatKigaliTime(new Date(preview.startAt))}</span>
          </p>
          <p className="meta font-mono">{preview.reference}</p>
        </div>
      )}

      {!result.ok && (
        <p className="small" role="alert" style={{ color: "var(--alarm)" }}>
          {result.message}
        </p>
      )}

      {checkedIn ? (
        <div className="stack--tight">
          <p className="body">Show {preview?.clientName.split(" ")[0]} to {preview?.suiteName}.</p>
          <div>
            <button className="btn btn--sm" type="button" onClick={onDone}>
              Scan next
            </button>
          </div>
        </div>
      ) : result.ok ? (
        <form action={action} className="cluster">
          <input type="hidden" name="bookingId" value={result.preview.bookingId} />
          <input type="hidden" name="payload" value={payload} />
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "Checking in…" : "Check in"}
          </button>
          <button className="btn btn--outline btn--sm" type="button" onClick={onDone}>
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <button className="btn btn--outline btn--sm" type="button" onClick={onDone}>
            Scan again
          </button>
        </div>
      )}
    </section>
  )
}
