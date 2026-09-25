@AGENTS.md

# Amari Wellness — product plan

This is the master plan for turning Amari from a design preview into a working business system. Read it at the start of every session.

**Rules for working on this plan**

- **Nothing is built without the owner's explicit go-ahead for that phase.** Planning and questions are fine; code for a new phase waits until the owner says go.
- When an item is done and verified, tick it (`- [x]`). When every item in a phase is ticked, change the phase status to **Complete** and add a line to the progress log at the bottom (date, what shipped, commit).
- If a decision changes, update this file in the same commit as the change.
- Tax, legal and payment statements here are general guidance, not professional advice. Confirm them with a Rwandan accountant or the Rwanda Revenue Authority (RRA) before launch.

Status legend: **Complete** · **In progress** · **Not started** · **Waiting on owner**

---

## 1. The brief

Turn Amari Wellness — private, automated massage-chair suites in Kimihurura, Kigali, sold as 15-, 30- and 60-minute sessions, prepaid packs, gift vouchers and company accounts — into three connected parts:

1. **Public website**: already designed (see Phase A).
2. **Booking and payment engine**: live availability, mobile money and card payments, confirmations with a QR code, check-in at the door, and pack balances.
3. **Admin back office** that runs the whole business.

### What the owner asked for

- **Full admin control (create, read, update, delete) over everything:**
  - Sessions: names, durations, prices, quiet-hours prices, discounts and promo codes.
  - Opening hours, holidays, suites and maintenance blocks.
  - The business address, contact details, and social links in the footer (WhatsApp and Instagram for now).
  - Packs, vouchers and company accounts.
  - Website text and photos.
  - Clients and their history.
  - All incoming messages.
  - Staff accounts and their permissions.
- **One exception: no one, including the owner, can edit or delete recorded income.** Money only changes through traceable actions (refunds, discounts, credit notes), each logged with who did it and why.
- **Live availability:** a booked or payment-held time disappears for everyone immediately. Clients only see genuinely free times, and a suite can never be sold twice.
- **Payments and check-in:**
  - Clients pay by MTN MoMo, Airtel Money or card.
  - On success they receive an email and a WhatsApp message with a QR code.
  - Staff scan the QR at reception to check the client in and show their assigned suite.
- **Packs and balances:** the system tracks each session used, shows the remaining balance to the client and staff, and handles expiry automatically.
- **Finance and reports** in a professional dashboard: income by day, payment method and session type; clients; amounts generated; utilisation; exports for the accountant.
- **Make the idea big:** built to grow to more branches and more products.

---

## 2. The owner's view: what the system must achieve

Capacity is **4 suites × about 11 hours ≈ 44 suite-hours a day**. Every feature should serve one of these goals:

| Goal | What the system must do |
|---|---|
| Fill empty suite-hours | Live availability, quiet-hours pricing, waitlist, walk-in booking at the desk, reminders that cut no-shows |
| Never lose or leak money | Provider-confirmed payments only, an income record nobody can edit, daily reconciliation against MoMo, Airtel and card statements |
| Earn repeat visits | Packs, vouchers, company accounts, one-tap "book again", balance-expiry reminders |
| Run the floor smoothly | QR check-in, the 15-minute turnover enforced by the schedule, suite status board, maintenance blocks |
| Know the numbers | Utilisation, revenue per suite-hour, share of new vs returning clients, no-show rate, unused-pack liability |

### Additions the brief didn't mention (agreed as part of the plan)

- **Cash received is not revenue earned.** Unused pack sessions and vouchers are money owed to clients (a liability) until used. Reports show both figures.
- **Tax receipts (EBM) and VAT.** See section 5.
- **Data protection:** Rwanda's Law No. 058/2021 covers the phone numbers, emails and health answers we store. We need:
  - Registration as a data controller, if required.
  - A privacy notice on the website.
  - Consent before sending marketing messages.
  - The ability to export or delete a client's data on request.
- **Cancellation and no-show policy enforced by the system:** free cancellation up to 4 hours before, as the site already promises. After that the session is forfeited or a pack credit is used.
- **Health safety check at first booking:** pregnancy, pacemaker, recent surgery, spinal injury. The site already promises to turn such bookings away until the client has spoken to us.
- **Multi-location from day one:** every record belongs to a location, so a second branch is configuration, not a rebuild.
- **Chair care:** run-hours per chair, service reminders, and taking a suite out of service in one tap.
- **Payment holds and expiry:** an unpaid hold releases its time slot automatically after 10 minutes.

---

## 3. Key decisions

- **Clients have accounts, but no passwords, and signing up is never required before booking.**
  - Booking asks for name and phone, then a one-time code by SMS or WhatsApp, then payment.
  - The account is created automatically from the verified phone number.
  - Returning clients enter their number and a code to see bookings, QR codes, pack balance, vouchers and receipts.
  - Company staff join their company's account through an invite link.
- **Money is add-only.** All income comes from a ledger (a list of money movements that can only be added to, never edited). Every payment, refund, discount, pack purchase, pack use and voucher redemption is a new entry. "Money generated" is always calculated from it and never stored as an editable number.
- **Prices are copied onto each booking when it's made.** Changing a price affects future bookings only.
- **Roles instead of one all-powerful login:**

| Role | Can | Cannot |
|---|---|---|
| Owner | Everything: prices, hours, suites, content, staff, all reports, refunds, discounts | Edit or delete recorded income (nobody can) |
| Manager | Bookings, clients, suites, content, messages, promo codes | Manage staff, full finance |
| Front desk | Check-in, walk-in bookings, suite status, messages | Change prices, refund, export data |
| Finance / accountant | Payments, reconciliation, reports, exports, company invoices | Change bookings or website content |

  Every sensitive action (refund, price change, manual adjustment) requires a reason and goes into the activity log with before and after values.
- **What makes it easy to use:**
  - Three taps to book: length, time, pay.
  - Mobile money first.
  - WhatsApp as the main message channel.
  - One QR code at the door.
  - If a time is shown, it can be booked.
  - The admin opens on "today".
  - Every correction is an explicit, logged action, never a silent edit.

---

## 4. Architecture

### Technology (to be confirmed when Phase 1 starts)

| Layer | Choice |
|---|---|
| App | The existing Next.js 16 app: website, client area, admin, and staff check-in in one codebase. Wire up the existing admin preview in `src/components/admin/` rather than rebuilding it |
| Database | PostgreSQL (managed, e.g. Neon or Supabase) with Drizzle or Prisma for data access |
| Login | Better Auth or Auth.js. One-time codes for clients; email login plus two-step verification for staff |
| Payments | A provider covering MTN MoMo, Airtel Money and cards in Rwanda. Candidates: Flutterwave, Paypack, DPO Pay, Pesapal. Compare fees, settlement speed and payment notifications, and verify current coverage first |
| Messages | Resend or Postmark (email), WhatsApp Business Cloud API (confirmations and reminders), Africa's Talking (SMS and one-time codes) |
| Background jobs | Inngest, Trigger.dev, or scheduled jobs on the host |
| Files | Cloud storage for photos and exports. Replaces the Pinterest hot-links flagged in `src/data/images.ts` |
| Hosting and quality | Vercel + managed Postgres, Sentry for errors, uptime alerts, daily backups, automated tests for the booking and payment rules |

### Data model

- **Location:** address, hours, holidays, social links, time zone.
- **Suite:** its chair, status (ready, occupied, cleaning, maintenance).
- **Session type** and **price history**.
- **Client:** phone as main identifier, name, email, consents, health acknowledgement, notes.
- **Booking:** held → confirmed → checked in → completed, or cancelled / no-show. It stores the price at booking time, the suite, the start and end time including turnover, and a QR token.
- **Payment:** provider reference, amount, method, status. It is created from the provider's confirmation and can never be edited.
- **Ledger entry:** add-only (see section 3).
- **Pack product**, **pack purchase** (sessions remaining, expiry, owner), **voucher** (code, balance, expiry).
- **Company account:** contract, balance, members, invoices.
- **Promo code:** percentage or fixed amount, valid dates, usage limits, which sessions it applies to.
- **Message:** from the contact form or WhatsApp, with status and assignee.
- **Staff user**, **role**, **activity log**.
- **Site content:** text, photos, FAQs, social links.
- **EBM receipt reference** on each sale (section 5).

### Rules the system must enforce

1. **No double booking, enforced by the database itself.** A PostgreSQL rule makes it impossible for one suite to hold two overlapping bookings (turnover included), even if two clients click at the same second.
2. **A 10-minute hold while the client pays.** Unpaid holds expire and the slot reappears. Availability is always calculated live.
3. **A booking is confirmed only when the payment provider confirms payment**, never on the browser's word. Confirmation triggers email, WhatsApp and the QR code, plus reminders 24 hours and 2 hours before.
4. **QR check-in.** The QR is signed so it can't be forged, and it's valid only on the day and only once. Scanning shows the client, session, suite and pack balance. One tap checks them in, uses a pack credit if needed, and sets the suite to occupied.
5. **Packs:** one session is used per check-in, a reminder goes out two weeks before expiry, and expiry is automatic.
6. **Background jobs:** expire holds, send reminders, mark no-shows, expire packs and vouchers, and reconcile payments daily.

---

## 5. Tax and compliance (Rwanda)

- **Payment gateways do not handle our taxes.** They move money and take a fee. Rwanda's 2026 rule that makes payment providers withhold VAT applies only to foreign digital suppliers, not to a local in-person business like Amari.
- **VAT registration** is required above RWF 20 million turnover a year or RWF 5 million in a quarter. At about 10 half-hour sessions a day (≈ 13.5M RWF a quarter), Amari crosses the quarterly threshold in its first quarter.
- **EBM receipts are mandatory once VAT-registered.** The RRA also says EBM applies to businesses registered for income tax, and that every sale needs a signed receipt whether paid by mobile money, transfer or cash. Company clients need EBM invoices to claim expenses.
- **Implications:**
  - Prices are VAT-inclusive at 18% (a 15,000 RWF session contains about 2,288 RWF VAT). Confirm margins before launch.
  - Phase 1: issue EBM receipts from the RRA's own software at the desk and store the receipt number against each payment.
  - Phase 3: connect the system directly to the RRA's Virtual Sales Data Controller (VSDC), which needs RRA certification, so each paid booking gets its signed receipt automatically.
  - Accountant to decide: is VAT on packs and vouchers due at purchase or when each session is used?
- Sources:
  - https://taxsummaries.pwc.com/rwanda/corporate/other-taxes
  - https://www.rra.gov.rw/en/about-ebm
  - https://www.rra.gov.rw/fileadmin/user_upload/vsdc_specification_document_v1.0.4__2022.pdf
  - https://www.newtimes.co.rw/section/read/204315

---

## 6. Phases

### Phase A: Design and front-end preview. **Complete**

- [x] Design system rebuilt (`globals.css`, surfaces, one type scale, arch, dial) and documented in `AGENTS.md`
- [x] Every public page rebuilt: home, space, sessions, packs, book, contact, journal and articles, account, 404
- [x] Anthropic frontend-design skill vendored at `.claude/skills/frontend-design/` and applied: time instrument hero, rows over cards, no templated defaults
- [x] Booking flow preview (radios, taken slots, ticket, `.ics` download), contact form that hands off to WhatsApp or email
- [x] Favicon, share image, sitemap, robots, manifest, JSON-LD, per-page metadata
- [x] Checks: production build, zero accessibility-scan (axe) violations on every route, scripted interaction tests
- [x] Admin back-office design preview exists (`/admin`, sample data only)

### Phase 0: Business decisions (before any backend code). **Waiting on owner**

The decision pack is prepared at [`docs/phase-0-decisions.md`](docs/phase-0-decisions.md):
a payment-provider comparison with sources, a draft cancellation/no-show
policy, a draft privacy notice, and the full go-live configuration checklist.
None of the choices below are made yet — the pack exists so they can be made
quickly. **Phase 1 does not wait on this phase being ticked off**: it is
built against a sandbox payment adapter and placeholder content so it can be
built and tested now, and switched to real providers/content as each item
below is decided.

- [ ] Choose and contract a payment provider (MoMo, Airtel Money, cards); get sandbox keys — comparison ready, see decision pack §1
- [ ] Confirm VAT/EBM obligations with an accountant; decide VAT timing for packs and vouchers
- [ ] Data-protection registration, privacy notice text, marketing-consent wording — draft ready, see decision pack §3
- [ ] Confirm real brand name, domain, address and Plus Code, phone and WhatsApp number, Instagram handle, email
- [ ] Confirm final prices (VAT-inclusive), quiet-hours window, cancellation and no-show policy, pack terms — draft policy ready, see decision pack §2
- [ ] Commission real photography (suites, chair, lounge, lockers); replace the Pinterest hot-links
- [ ] WhatsApp Business account and message templates approved by Meta — start early, approval has lead time
- [ ] Pick hosting and database providers; create the accounts — recommendation: Vercel + managed Postgres (Neon), see §4 Architecture

### Phase 1: Launchable minimum. **In progress**

Sub-phases below match the P1.x tasks worked in order; tick a line only once it's built **and** verified (tests passing against a real Postgres, not just written).

**P1.1 — Database foundation. Complete.**
- [x] Full schema: locations, suites, session types + price history, clients (phone-identified, passwordless, walk-ins allowed with no phone), staff + roles, bookings, payments, the append-only ledger, packs, vouchers, companies, promo codes, messages, activity log, editable content/FAQs/social links, EBM receipt reference — see `docs/database.md`
- [x] Database-level no-double-booking guarantee (a Postgres exclusion constraint, not application logic) — tested
- [x] The ledger and activity log are append-only at the database level (a trigger rejects UPDATE/DELETE for any role) — tested
- [x] Price history: a booking keeps the price it was made at; changing a price never rewrites the past
- [x] Migrations (generated + hand-written), a seed script that loads today's `src/data/*.ts` content into real rows, and a test database with 12 passing constraint tests
- [ ] Daily backups — a hosting/provider setting for Phase 0, not code; revisit once a managed Postgres provider is chosen

  > **Note for future sessions:** this cloud sandbox's own Postgres (used to build and test the above) does not persist between sessions — only what's committed to git does (the schema, migrations, and seed script). A fresh session picks up exactly where P1.1 left off by running `pnpm db:migrate && pnpm db:seed` against a database it creates itself (see `docs/database.md`), not by expecting yesterday's local data to still be there. A real, persistent database is a Phase 0 hosting decision (managed Postgres — Neon or similar).

**P1.2 — Staff auth, roles, activity log. Complete.**
- [x] Staff sign-in (email + password) with mandatory two-step verification (RFC 6238 TOTP, from `node:crypto` — no external auth dependency); first login walks through QR enrollment, every login after just asks for the 6-digit code
- [x] A generated TOTP secret is only written to the account once a correct code proves the visitor actually captured it — a wrong first code leaves the account re-enrollable, not half-configured
- [x] Login lockout: 5 failed attempts (password or code) locks the account for 15 minutes; the counter resets on a lock and on a success
- [x] Sessions are database-backed, not just a signed cookie: the JWT names a row in `staff_auth_sessions`, so revoking a session (sign-out) actually ends it server-side, not just clears client state
- [x] Roles (Owner, Manager, Front desk, Finance) and the full capability table from §3, enforced by a single `can(role, capability)` source of truth — no "ledger.edit"/"income.edit" capability exists for any role, so the income-immutability rule can't be accidentally coded around later
- [x] Activity log wired to real actions (login, MFA enrollment, logout so far); a Data Access Layer (`requireStaffPage`/`requireStaffAction`) so every future admin page and Server Action re-checks auth itself, not just the page that renders the link to it
- [x] `/staff/*` protected by both an optimistic proxy redirect (fast, no DB call) and an authoritative database check in the DAL (the one that actually decides access)
- [x] 43 unit/integration tests (TOTP against official RFC 4226 test vectors, password hashing, lockout against a real Postgres, role table) plus a 15-assertion end-to-end run against a real built-and-started server covering the whole flow: unauthenticated redirect, wrong password, first-login enrollment, wrong code, correct code, session survives reload, sign-out, re-protection, second login without re-enrollment

**P1.3 (part 1) — Website reads content and prices from the database. Complete.**
- [x] `src/server/db/content.ts`: cached, `server-only` read functions for the location (address, contact, hours, quiet-hours end hour), social links, session types + current price, pack products (price, per-session and saving figures computed, not stored), FAQs by group, and freeform content blocks (tagline, hygiene protocol, first-visit timeline, the shelf) — shaped to match the old static interfaces so pages barely changed
- [x] Every public page and the root layout (Nav, Footer, JSON-LD) fetches from the database; `src/data/site.ts` deleted, `SESSIONS`/`PACKS` arrays removed from `sessions.ts`/`packs.ts` (kept: presentation-only constants with no row to live in — `INCLUDED`, `OFF_PEAK`, `PARTNER_SESSIONS`, `GIFT_VOUCHER`, `CORPORATE`, `formatRWF` — and the whole of `journal.ts`/`images.ts`, see the P1.3 commit message for why)
- [x] The footer now actually shows WhatsApp and Instagram links (new icons, `social_links` table) — this was in the original brief but had never been built
- [x] The whole app is `export const dynamic = "force-dynamic"` from the root layout down: an admin's edit (once P1.3 part 2 ships) shows up on the next request, not the next deploy, and — as important — `next build` never needs a reachable database (see the note in `layout.tsx` and the P1.2 lazy-connection fix it builds on)
- [x] Verified against a real Postgres: full build with and without `DATABASE_URL` reachable, every page fetched and checked for real seeded content (not placeholders), the existing 43 unit tests and 15-assertion staff-auth E2E re-run clean

- [ ] **P1.3 (part 2)** — Admin editing: session types and prices (price history), hours, holidays, suites, maintenance blocks, address, contact and social links, website text and photos, FAQs — the write side, built on part 1's read path and P1.2's roles
- [ ] **P1.4** — Live availability engine: payment holds, 15-minute turnover (database-level no-double-booking rule already built in P1.1)
- [ ] **P1.4** — Client flow: phone plus one-time code, health acknowledgement, pay by MoMo, Airtel or card, provider-confirmed booking
- [ ] **P1.4** — Add-only ledger wired to real payments; refunds and discounts as logged actions with reasons (the database rules were built in P1.1; this is the application code that uses them)
- [ ] **P1.5** — Confirmation email and WhatsApp with signed QR code; 24-hour and 2-hour reminders
- [ ] **P1.5** — Staff check-in scanner and suite status board
- [ ] **P1.5** — Client area: bookings, QR codes, receipts, cancel or reschedule within policy
- [ ] **P1.6** — Contact form and messages inbox (status, assignee, reply)
- [ ] **P1.6** — Reports: daily and monthly income by method and session type, bookings, clients, CSV export
- [ ] **P1.6** — EBM receipt number recorded per sale (receipts issued from RRA software at the desk)
- [ ] **P1.4/P1.5** — Cancellation and no-show rules enforced; hold expiry and reminder jobs
- [ ] **P1.6** — Privacy notice page; marketing consent; client data export and deletion
- [ ] **P1.6** — Tests for booking, availability, payment and ledger rules (constraint-level tests already passing from P1.1); error monitoring; uptime alerts

### Phase 2: Revenue growth. **Not started**

- [ ] Packs: purchase, automatic balance tracking, use on check-in, sharing, expiry and reminders
- [ ] Gift vouchers: purchase, code delivery, partial redemption, expiry
- [ ] Company accounts: members via invite link, shared balance, invoicing by bank transfer, monthly usage summary
- [ ] Promo codes and discounts (limits, dates, sessions)
- [ ] Full finance: daily reconciliation against provider statements, cash vs earned revenue, pack and voucher liability
- [ ] Professional dashboards: utilisation heatmap, revenue per suite-hour, returning-client share, no-show rate, session mix, PDF and CSV exports for the accountant
- [ ] Client profiles: visit history, preferences, notes, lifetime value

### Phase 3: Scale. **Not started**

- [ ] Direct EBM connection to the RRA's VSDC (RRA certification), with signed receipts attached to confirmations
- [ ] Waitlist for full slots with automatic offers when a slot frees up
- [ ] Reviews and referrals
- [ ] Installable phone app (PWA) and Apple/Google wallet passes for QR codes
- [ ] Memberships, if demand appears
- [ ] Multi-location: second branch set up entirely from the admin
- [ ] Chair maintenance tracking: run-hours, service reminders

---

## 7. Open questions for the owner

- Which payment provider do you prefer, or should we compare the candidates first?
- Is the brand name "Amari" final? What domain will we use?
- Should walk-in clients also get a QR and an account, or can the desk book them without a phone number?
- Can company pack balances be used by any employee, or only by named people?

---

## 8. Progress log

| Date | Phase | What shipped | Commit |
|---|---|---|---|
| 2026-09-25 | A | Design system, all public pages, platform metadata, accessibility checks | `d1f44ff`, `a4e1cb1` |
| 2026-09-25 | A | frontend-design skill installed and applied; Phase A marked complete | `546e19b` |
| 2026-09-25 | — | This plan saved to `CLAUDE.md` | (this commit) |
| 2026-09-25 | 0 | Owner decision pack: payment provider comparison, draft cancellation and privacy policies, go-live checklist | see `docs/phase-0-decisions.md` |
| 2026-09-25 | P1.1 | Full schema (30 tables), the no-double-booking and append-only-ledger database guarantees, migrations, seed script, 12 passing tests against a real Postgres | `21a960e` |
| 2026-09-25 | P1.2 | Staff sign-in with mandatory TOTP two-step verification, roles and the full capability table, database-backed sessions, login lockout, activity log, a Data Access Layer every future admin page and action goes through; 43 unit tests plus a 15-assertion end-to-end run. Also fixed a real Vercel build failure this phase exposed: `db/client.ts` threw on missing `DATABASE_URL` at module-import time, which broke the build the moment any page imported it — the connection is now opened lazily, on first real query | `8ac1301`, `0785017` (PR #5) |
| 2026-09-25 | P1.3 (1/2) | The whole public site (every page, Nav, Footer, JSON-LD) now reads content and prices from the database instead of `src/data/*.ts`; added the WhatsApp/Instagram footer links the original brief asked for and never got built; whole app forced dynamic so an edit is live on the next request and `next build` never needs a reachable database | (this commit) |
