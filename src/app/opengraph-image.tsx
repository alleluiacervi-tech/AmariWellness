import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { SESSIONS } from "@/data/sessions"

export const alt =
  "Amari — A chair. A quiet room. Time to think. Private massage suites in Kimihurura, Kigali."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const asset = (path: string) => readFile(join(process.cwd(), "src/assets", path))

/* The share card, drawn from the same tokens as the site: paper ground,
   forest ink, serif headline with its sage italic, the arch, the dial. */
export default async function OpenGraphImage() {
  const [serif, serifItalic, sans, mono, mark] = await Promise.all([
    asset("fonts/InstrumentSerif-Regular.ttf"),
    asset("fonts/InstrumentSerif-Italic.ttf"),
    asset("fonts/DMSans-Medium.ttf"),
    asset("fonts/DMMono-Regular.ttf"),
    asset("amari-mark.svg"),
  ])
  const markSrc = `data:image/svg+xml;base64,${mark.toString("base64")}`

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf8f4",
          color: "#1c3528",
          fontFamily: "DM Sans",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 0 60px 72px",
          }}
        >
          <div
            style={{
              fontSize: 17,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#446f55",
            }}
          >
            Private massage suites · Kigali
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Instrument Serif", fontSize: 96, lineHeight: 0.98, letterSpacing: "-0.02em" }}>
            <span>A chair.</span>
            <span>A quiet room.</span>
            <span style={{ fontStyle: "italic", color: "#3d6b52" }}>Time to think.</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={markSrc} width={54} height={54} alt="" />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "Instrument Serif", fontSize: 32, lineHeight: 1 }}>Amari</span>
              <span style={{ fontFamily: "DM Mono", fontSize: 17, color: "#7d6210" }}>
                15 · 30 · 60 min — from {SESSIONS[0].price}
              </span>
            </div>
          </div>
        </div>
        <div
          style={{
            width: 430,
            margin: "48px 48px 48px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#1c3528",
            borderRadius: "210px 14px 14px 14px",
          }}
        >
          <div
            style={{
              width: 250,
              height: 250,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              border: "3px solid #d4af37",
              borderLeftColor: "rgba(244,241,235,0.18)",
              borderBottomColor: "rgba(244,241,235,0.18)",
            }}
          >
            <div
              style={{
                width: 176,
                height: 176,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                background: "#faf8f4",
              }}
            >
              <img src={markSrc} width={128} height={128} alt="" />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Instrument Serif", data: serif, style: "normal", weight: 400 },
        { name: "Instrument Serif", data: serifItalic, style: "italic", weight: 400 },
        { name: "DM Sans", data: sans, style: "normal", weight: 500 },
        { name: "DM Mono", data: mono, style: "normal", weight: 400 },
      ],
    },
  )
}
