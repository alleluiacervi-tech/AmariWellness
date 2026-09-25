import { ImageResponse } from "next/og"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/* iOS clips its own rounded corners, so this is a full-bleed square. */
export default async function AppleIcon() {
  const mark = await readFile(join(process.cwd(), "src/assets/amari-mark.svg"))
  const src = `data:image/svg+xml;base64,${mark.toString("base64")}`
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8f4",
        }}
      >
        <img src={src} width={132} height={132} alt="" />
      </div>
    ),
    size,
  )
}
