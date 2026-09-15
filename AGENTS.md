# amari-wellness

Next.js (App Router) + Tailwind CSS v4 marketing site for Amari, a fictional automated massage-chair lounge in Kimihurura, Kigali, Rwanda.

## Development Server

Start it with `npm run dev` / `pnpm dev` (`next dev`, Turbopack by default). Not run automatically — start it yourself when you need to see changes live.

## Pushing to GitHub

This machine has **no working git** — Xcode Command Line Tools are not installed, so `git` and `gh` both fail. Until `xcode-select --install` has been run, push with:

```
node scripts/push.mjs "commit message"
```

It writes a single commit to `alleluiacervi-tech/AmariWellness` through the GitHub Git Data API. The token is read from the macOS Keychain (service `amari-github-pat`), never from a file — never write a token into the repo. Once real git is available, use it instead and delete `scripts/push.mjs`.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/app/layout.tsx` - Root layout: `<html>`/`<body>` shell, `next/font` (DM Sans + Lora) wiring, global `Nav`/`Footer`, and the default site `metadata`
- `src/app/globals.css` - Global CSS entrypoint and Tailwind CSS v4 import (`@import 'tailwindcss'`), plus the hand-written design-token system (`@theme`, CSS custom properties, component classes)
- `src/app/page.tsx`, `src/app/*/page.tsx` - Route pages (App Router file-based routing): `/`, `/space`, `/sessions`, `/packs`, `/book`, `/contact`. Static/content pages are Server Components with a `metadata` export; pages needing interactivity (`book`, `contact`) are `'use client'` and get their `metadata` from a sibling `layout.tsx` instead, since a client page cannot export `metadata` itself
- `src/app/not-found.tsx` - Global 404 (Next.js special file convention)
- `src/components/` - Shared UI. Anything using hooks/browser APIs/event handlers is marked `'use client'` at the top (`Nav`, `Link`, `Figure`, `Reveal`, `Accordion`, `SessionRecommender`, `StickyBook`, `Footer`); purely presentational components (`Placeholder`, `LocationCard`) stay Server Components even though they're rendered from client trees
- `src/components/Link.tsx` - Thin wrapper around `next/link` that adds a smooth scroll-to-top on non-hash navigations
- `src/components/Figure.tsx` - Wraps `next/image` (`fill` + `sizes`) with a loading shimmer and an error fallback card
- `src/data/*.ts` - Typed static content (site info, sessions, prepaid packs, image set) consumed by the pages. `journal.ts` holds six written articles that no route currently renders
- `public/` - Static assets served from `/`, e.g. `amari-horizontal.svg`
- `next.config.mjs` - `images.remotePatterns` (allows `images.unsplash.com`) and `turbopack.root`
- `postcss.config.mjs` - Wires the Tailwind v4 PostCSS plugin (`@tailwindcss/postcss`)
- `.mise.toml` - Toolchain versions for Node.js and pnpm

## Dependencies

- Framework: Next.js (App Router, Turbopack) on React 19 / React DOM 19
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`
- Formatting: oxfmt

## Styling

This project uses **Tailwind CSS v4** through the `@tailwindcss/postcss` plugin configured in `postcss.config.mjs`. `src/app/globals.css` imports Tailwind with `@import 'tailwindcss';` and defines the brand palette/type scale in an `@theme` block plus plain CSS custom properties. Use Tailwind utility classes directly in JSX; put global CSS or Tailwind v4 theme customization in `src/app/globals.css`. This project does not need a `tailwind.config.js`.

Fonts (DM Sans, DM Mono, Lora) are loaded via `next/font/google` in `src/app/layout.tsx` and exposed as the `--font-dm-sans` / `--font-dm-mono` / `--font-lora` CSS variables, which `globals.css`'s `--font-sans` / `--font-mono` / `--font-serif` tokens build on — don't reintroduce a manual Google Fonts `@import` or hardcode a literal font-family string (a literal loses `next/font`'s metric-matched fallback); reference `var(--font-sans)` / `var(--font-serif)` / `var(--font-mono)` instead.

### The three type roles

One rule, and it is worth keeping:

- **Lora (serif)** — the room speaks. Display headlines, page titles, quotes, session names.
- **DM Sans** — you speak. Body copy, UI, labels, navigation, buttons.
- **DM Mono** — the machine speaks. Durations, prices, times, reference codes, step numbers, Plus Codes. Nothing that isn't data.

### Surfaces

Sections declare a surface class — `.surface-paper`, `.surface-dim`, `.surface-dark`, `.surface-deep` — and every component reads the resulting `--s-ground` / `--s-ink` / `--s-body` / `--s-meta` / `--s-rule` / `--s-accent` / `--s-focus` tokens rather than a literal colour. Buttons, rules, form fields and focus rings then come out correct on any ground automatically. **Never hardcode a colour in a component**; if a component looks wrong on a surface, the surface's tokens are what to fix.

Gold (`--gold`) means one thing: the machine. Durations, prices, controls, timings. It is not a decorative bullet. Sage marks the human and organic. On light grounds use `--gold-text` / `--sage-text`, which clear AA; the raw brand tones only pass on dark.

Pages whose first screen is a dark full-bleed surface mark it with `data-dark-top`; `Nav` reads that from the DOM and floats transparent over it until it scrolls past.

## Routing & Server/Client boundary

Keep the client boundary as low (as close to the leaf) as possible: a page should only be `'use client'` if it directly uses a hook, browser API, or inline event handler — interactivity already encapsulated in a child component (e.g. `Figure`, `FadeIn`, `SessionRecommender`) doesn't require the parent page to also be a Client Component. When a page must be `'use client'` and also needs SEO `metadata`, put the `metadata` export in a sibling `layout.tsx` instead (see `src/app/contact/`), since Next.js forbids exporting `metadata` from a Client Component module. A client page reading `useSearchParams()` must be wrapped in `<Suspense>` (see `src/app/book/page.tsx`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
