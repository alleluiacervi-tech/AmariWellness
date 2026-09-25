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

## Design direction

The site follows Anthropic's **frontend-design** skill, vendored at `.claude/skills/frontend-design/` (Claude Code loads it automatically; read it before any visual work). Applied to this brief:

- **Time is the product, so the gold dial is the one bold element.** The home hero is an instrument (`HeroTime`): pick 15, 30 or 60 minutes and the dial sweeps to it while name, price and the book button follow. Everywhere else the dial is a small quiet glyph beside a duration.
- **Everything around it stays quiet.** Headlines are plain upright serif — never one word picked out in italic or colour. Sentence case everywhere; no all-caps eyebrows, and a label only when it tells the reader something the heading does not. No `→` or bloom appended to link and button text. No details strung together with middle dots — use commas, line breaks or a small table (`Hours`).
- **Structure is information.** Comparisons are rows (`.rows` / `.row`), not grids of identical cards. Numbers and rules only where the content is a sequence (the first-visit timeline, booking steps).
- **Stillness is the brand.** One page-load moment per page (`.enter`, `.enter-media`, and on home the dial's sweep). No scroll-in effects and no hover lifts; motion otherwise only answers the visitor (dial change, accordion, booking steps).
- The home headline steps down line by line, the way the chair reclines. That is the type's one flourish.

## Project Structure

This is the canonical project structure. Start with task-relevant files below. Only follow imports or inspect other files when required, when a documented path is missing, or when the repository contradicts this guide.

- `src/app/layout.tsx` - Root layout: `<html>`/`<body>` shell, `next/font` wiring (DM Sans, DM Mono, Instrument Serif), global `Nav`/`Footer`, default `metadata` + `viewport`, and the site-wide LocalBusiness JSON-LD
- `src/app/globals.css` - The whole design system: Tailwind v4 import, `@theme`, then `@layer base` (tokens, surfaces, element defaults) and `@layer components` (every pattern, grouped by where it lives)
- `src/app/page.tsx`, `src/app/*/page.tsx` - Routes: `/`, `/space`, `/sessions`, `/packs`, `/book`, `/contact`, `/journal`, `/journal/[slug]`, `/account` (sample returning-guest view), `/admin` + `/admin/login` (back-office design preview). Every page is a Server Component with its own `metadata`
- `src/app/not-found.tsx` - Global 404
- `src/app/icon.svg`, `apple-icon.tsx`, `opengraph-image.tsx`, `manifest.ts`, `robots.ts`, `sitemap.ts` - Metadata file conventions. The share card and apple icon are generated at build time from `src/assets/` (lotus mark + OFL brand fonts as TTF)
- `src/lib/metadata.ts` - `pageMetadata({ title, description, path })`. Use it for every page: Next merges metadata shallowly, so a page that sets only `title` inherits the root's share card, canonical included
- `src/components/` - Shared UI (see below)
- `src/components/admin/` - The back-office preview; self-contained, with its own scoped `admin.css`. Nav and Footer hide themselves on `/admin`
- `src/data/*.ts` - Typed static content: `site.ts` (address, hours + numeric `schedule`, visit steps, hygiene protocol, FAQs, shelf), `sessions.ts`, `packs.ts`, `journal.ts`, `images.ts`. **Being retired**: this is the same content Phase 1.1 seeded into the database (`pnpm db:seed`); pages still read from these files until Phase 1.3 switches them to the database, at which point these files go away
- `src/server/db/` - The backend (Phase 1, see `CLAUDE.md`). `schema/*.ts` is the data model — read `docs/database.md` before touching it, especially before changing `bookings` or `ledger_entries`. `migrations/` includes hand-written SQL (`0001_constraints_and_guards.sql`) alongside `drizzle-kit generate` output; both apply through `pnpm db:migrate`. `client.ts` is the app's DB connection (`server-only`-guarded — never imported by a script run outside Next, which needs its own connection; see the comment in `seed.ts`)
- `src/server/auth/password.ts` - scrypt password hashing for staff logins (Node's built-in `node:crypto`, no native dependency)
- `public/` - Static assets, e.g. `amari-horizontal.svg`
- `next.config.mjs` - `images.remotePatterns` (Unsplash, Pinterest — see the launch note in `images.ts`) and `turbopack.root`
- `docs/database.md` - How to run Postgres locally, what each migration script does, and what the money/booking constraints actually guarantee
- `docs/phase-0-decisions.md` - The owner's decision pack: payment-provider comparison, draft policies, go-live checklist

### Components

Client (`'use client'`): `Nav` (scroll state, accessible menu dialog), `Footer`, `Link` (next/link + smooth scroll-to-top), `Figure` (next/image + shimmer + fallback), `HeroTime` (the home hero's time instrument), `OpenStatus` (live open/closed in Kigali time), `BookingFlow`, `ContactForm`.

Server: `PageHeader` (how every inner page opens), `SectionHead`, `CtaBand` (how every inner page ends), `Faq` (native `<details>`), `Dial` (a duration as a gold arc against the hour; `sweep` once per page), `Hours`, `PaymentMethods` / `PaymentMark`, `Bloom` (brand mark only — 404, image fallback, notices), `icons`.

## Dependencies

- Framework: Next.js 16 (App Router, Turbopack) on React 19 / React DOM 19
- Styling: Tailwind CSS v4 via `@tailwindcss/postcss`
- Formatting: oxfmt — note that 0.2.0 can relocate comments to the top of a file; check the diff after running it

## Styling

Tailwind CSS v4 through `@tailwindcss/postcss`; no `tailwind.config.js`. All hand-written CSS lives in `src/app/globals.css` **inside `@layer base` or `@layer components`** — never unlayered. Unlayered CSS beats every layer, so it would silently override Tailwind utilities; kept in layers, a utility class on an element (`justify-between`, `items-start`, `mr-3`) always wins. Use utilities for one-off layout tweaks; add a component class when a pattern repeats. Inline `style` is only for values computed from data (a meter width).

Fonts are loaded with `next/font/google` in `layout.tsx` as `--font-dm-sans` / `--font-dm-mono` / `--font-instrument-serif`, which the `--font-sans` / `--font-mono` / `--font-serif` tokens build on. Don't reintroduce a Google Fonts `@import` or a literal font-family string.

### The three type roles

One rule, and it is worth keeping:

- **Instrument Serif** — the room speaks. Headlines, page titles, session and pack names, quotes. Upright; italic only for a whole line (a session's one-line intro), never for an accent word.
- **DM Sans** — you speak. Body copy, UI, labels and eyebrows, navigation, buttons.
- **DM Mono** — the machine speaks. Durations, prices, clock times, reference codes, Plus Codes — the numbers themselves. Dates, "a session", "Saves…" and every other word stay in DM Sans.

One scale: `.display` (home hero only), `.h1` (page titles), `.h2` (section titles), `.h3` (card titles), `.h4` (list items, FAQ questions), `.lead`, `.body`, `.small`, `.meta`, `.label`. Don't set a heading's `font-size` locally.

### Surfaces

Sections declare a ground — `.surface-paper` (default), `.surface-stone` (one band per page at most), `.surface-deep` (the one dark block, closing the home page); `.surface-dim` and `.surface-mist` exist for small panels. Separate sections with space, not alternating bands — and every component reads the resulting `--s-*` tokens (`ground`, `raised`, `sunk`, `field`, `ink`, `body`, `meta`, `rule`, `rule-2`, `label`, `accent`, `em`, `focus`, `btn`, `btn-ink`, `btn-hover`). Buttons, fields, rules and focus rings come out right on any ground automatically. **Never hardcode a colour in a component**; if something looks wrong on a surface, fix that surface's tokens.

Gold means one thing: the machine — durations, prices, the dial, the timeline. Sage marks the human and organic. On light grounds the accent resolves to `--gold-text`, which clears AA; raw `--gold` only passes on dark.

### Shape and motion

- One radius pair (`--r-sm` 4px for buttons and slots, `--r-md` 8px for cards) and one signature shape: **the arch** (`.arch`, large top-left radius), used on the hero and page-header photographs only.
- One entrance per page (`.enter` on the header copy, `.enter-media` on its photo; on home, the dial's sweep). Hover changes colour, never position. Nothing loops except the image shimmer while loading. Everything respects `prefers-reduced-motion`.

## Routing & Server/Client boundary

Keep the client boundary at the leaf: pages are Server Components, and interactivity lives in the component that needs it. A client component that reads `useSearchParams()` must sit inside `<Suspense>`; give the Suspense a fallback that renders the **same component with default props** (see `book/page.tsx` and `contact/page.tsx`), so the static HTML contains the real UI rather than a blank gap, and the URL's presets take over on hydration.

Links elsewhere on the site preset these flows: `/book?session=quick|half|full`, `/contact?subject=booking|pack|voucher|corporate|other` (plus `&pack=<id>` or `&amount=<RWF>` to draft the message).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
