import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Amari — Private massage suites, Kigali",
    short_name: "Amari",
    description: "A chair. A quiet room. Time to think.",
    start_url: "/",
    display: "browser",
    background_color: "#faf8f4",
    theme_color: "#faf8f4",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  }
}
