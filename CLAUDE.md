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
- [ ] Pick hosting and database providers; create the accounts — recommendation: Vercel + managed Postgres (Neon), see §4 Architecture. **A Neon database exists for testing** (connection string held outside git, in `.env.local` — see the note under P1.3 below on why it isn't wired into Vercel yet)

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

> **Note for future sessions — a real outage, and the safer staging since:** P1.3's read path (the whole site fetching content and prices from Postgres) was built, tested locally against a real Postgres, and merged — then immediately reverted, because it made **every page** require a reachable `DATABASE_URL` at request time, and Vercel's production deployment has none configured. The live site went down (every page threw a server error) until the revert landed.
>
> The fix wasn't just reverting — it was re-splitting the work so the risky part (flipping the *public* site's data source) is isolated from the safe part (giving *staff-only* pages, already behind auth, a real database to read and write). `src/server/db/content.ts` and the schema/seed extensions are back (staff routes need them); the public pages still read `src/data/*.ts` and stay fully static, verified with `pnpm build` both with and without `DATABASE_URL` reachable. **Do not merge the "public pages read from the database" change again until both of these are true in Vercel:**
> 1. `DATABASE_URL` set as an environment variable in the Vercel project (Production, and ideally Preview), pointing at a real reachable Postgres (a Neon database exists for this — see the Phase 0 checklist above; currently blocked on this sandbox's network policy not permitting a raw Postgres connection to it, so it hasn't been migrated or seeded yet either).
> 2. That database has migrations applied (`pnpm db:migrate`) and is seeded (`pnpm db:seed`) — an unmigrated/empty database fails differently but just as completely.
>
> The lesson generalizes beyond this one revert: the P1.2 phase fixed the same class of bug for *module imports* (`db/client.ts`'s lazy-connection Proxy, so `next build` never needs a database); this outage is the same bug one layer up, for *rendering*. Both are now handled by the code (`force-dynamic` on database-backed routes + the lazy client), but neither helps if production has no database to actually connect *to* — and neither excuses skipping a check against the real deployed site before calling database-dependent work done, not just a local build.

**P1.3 (part 2a) — Sessions & pricing, location & hours admin editing. Complete.**
- [x] `/staff/sessions` (capability `prices.edit`, Owner only): edit a session's name/label/intro/summary/about/highlights; set a new current price with a required reason — price history preserved (old row's `effectiveTo` closed, new row inserted, in one transaction), so a booking already made keeps its price
- [x] `/staff/location` (capability `hours.edit`, Owner only): business name, full address, contact details, weekly hours, turnover/quiet-hours/cancellation/hold settings; add and remove holidays; add and remove footer social links
- [x] Every mutation: validated with zod, logged to the activity log with before/after values, `revalidatePath("/", "layout")` so a future public-facing read reflects it immediately once part 1 is re-landed
- [x] The `/staff` home now links to what the signed-in staff member's role can actually use (`can()`-filtered), while each page and Server Action re-checks the same capability itself — the link list is a convenience, not the access control
- [x] Verified against a real Postgres with a 15-assertion Playwright run: login, edit description, edit price with reason, both persist after reload, add a holiday, add a social link, activity log shows all three actions, and — the important negative case — a Manager (who lacks `prices.edit`) sees no link to Sessions & pricing **and** is redirected server-side on a direct URL visit, not just hidden in the UI
- [x] Confirmed the public site is completely unaffected: after editing a session's price to 9,000 RWF through the admin, `/` and `/sessions` still show the original static 8,000 RWF — proof the two are correctly decoupled until part 1 is re-landed

**P1.3 (part 2b) — Suites + maintenance blocks, FAQs + content blocks admin editing. Complete.**
- [x] `/staff/suites` (capability `suites.maintenance` — Owner, Manager, Front desk): every suite with its maintenance blocks. Editing a suite's name/status/note (`suites.edit` — Owner, Manager only) and adding a suite are gated stricter than the page itself, so Front desk sees the floor and can take a chair in or out of service but can't rename or retire one
- [x] Maintenance blocks share the same no-overlap guarantee as bookings (the `maintenance_blocks_no_overlap` exclusion constraint from P1.1) — a conflicting block is caught and turned into a friendly error, not a 500
- [x] `/staff/content` (capability `content.edit` — Owner, Manager): the 6 plain-text content blocks (tagline, description, hours note, walk-ins note, contact response time, payments note); the 3 structured blocks (hygiene protocol, first-visit steps, shelf) edited as raw JSON for now, with parse and shape errors caught and shown inline rather than crashing the action; FAQs per group (home/sessions/space/packs) — add, edit, remove
- [x] Every mutation: validated with zod, logged to the activity log with before/after values, `revalidatePath("/", "layout")`
- [x] Verified against a real Postgres with a 25-assertion Playwright run covering: suite add/edit/persist, maintenance block add/remove and the overlap rejection, text- and JSON-block edit/persist and invalid-JSON rejection, FAQ add/edit/remove, activity log entries (checked both via the UI's last-5 list and a direct query, since 9 actions in one run push the oldest past the UI's window), and the capability boundary that matters here: Front desk reaches `/staff/suites` and can add a maintenance block but does not see the suite edit form, and is redirected server-side (not just UI-hidden) away from `/staff/content`, which it has no capability for
- [x] `pnpm build` still shows only `/staff/*` routes as dynamic (`ƒ`) — every public route stays static, the same safety property P1.3 part 2a established

- [ ] **P1.3 (part 1, re-land)** — Website reads all content and prices from the database instead of `src/data/*.ts` — blocked on the Neon/Vercel wiring above

**P1.4 (part a) — Availability engine, sandbox payments, ledger, staff booking board. Complete.**
- [x] `src/server/availability/`: `getDaySlots` (live per-hour availability honoring hours/holidays/turnover/quiet-hours/maintenance/existing bookings), `createHold` (self-healing stale-hold expiry inside the insert transaction, per migration 0001's documented design — a genuine race is decided by the `bookings_no_overlap` exclusion constraint, never application code), `confirm.ts` (`confirmSandboxPayment`/`recordWalkInPayment` — the one place a booking moves held → confirmed, always alongside the payment write that justifies it and a `payment_received` ledger entry, in one transaction), `expireStaleHolds` (the global sweep)
- [x] `src/server/payments/sandbox.ts` — the sandbox payment adapter `.env.example` already anticipated (`PAYMENTS_PROVIDER=sandbox`): `charge()` always returns "pending", exactly like a real MoMo/Airtel/card charge would — nothing is ever confirmed synchronously
- [x] `src/server/qr.ts` — HMAC-signed QR payload (`QR_SECRET`): `bookings.qrToken` stores only the random token, the signature is recomputed and checked at scan time (Phase 1.5), never stored
- [x] `/api/cron/tick` — bearer-protected by `CRON_SECRET`, runs `expireStaleHolds`; the one entry point Phase 1.5/1.6's reminder, no-show and pack/voucher-expiry jobs extend rather than each getting their own route
- [x] `src/server/ledger/refund.ts` / `discount.ts` — a refund cancels the booking and writes a negative `refund` ledger entry (partial refunds allowed, never more than was paid); a discount records a negative `discount_applied` entry against an already-confirmed booking without touching its `priceAtBookingRwf`. Both require a reason; both let the calling Server Action record the activity-log entry afterward, keeping the money-moving functions pure and directly testable
- [x] `/staff/bookings` (capability `bookings.view` — Owner, Manager, Front desk, Finance): today's schedule, plus a walk-in booking form (`bookings.create` — Owner, Manager, Front desk) that books and marks paid in one step since staff already has the payment confirmation in hand. Cancel (`bookings.cancel`), refund (`payments.refund` — Owner, Finance) and discount (`discounts.apply` — Owner, Manager) act per-row, each gated by its own capability
- [x] The health-safety check (CLAUDE.md §2) is enforced on every walk-in: a required checkbox before a booking is created, the same rule the online flow (part b) will apply
- [x] Money-moving and availability logic (`createHold`, `confirm.ts`, `expireStaleHolds`, `ledger/refund.ts`, `ledger/discount.ts`, `conflicts.ts`, `qr.ts`) take `db` as an explicit parameter rather than importing the app's singleton, and carry no `server-only` guard — the same pattern `src/server/auth/lockout.ts` established in P1.2, so this is directly unit-testable in vitest against a real Postgres rather than only reachable through a running server
- [x] 41 new unit/integration tests against a real Postgres (conflict detection and hold self-expiry, the exclusion-constraint race, quiet-hours/holiday/maintenance-aware slot computation, sandbox payment confirmation and ledger sign/amount, refund/discount validation and reason-required, QR sign/verify/tamper-detection) plus a 20-assertion Playwright run: three walk-ins created and paid in one step, health-ack rejection, cancel/refund/discount each producing the right booking status and ledger entry, and the capability matrix across Front desk (create + cancel, no refund/discount) and Finance (refund only, no create/cancel/discount)
- [x] `pnpm build` still shows only `/staff/*` and `/api/cron/tick` as dynamic (`ƒ`) — every public route, including the still-static `/book` preview, stays untouched

**P1.4 (part b) — Client OTP auth, health acknowledgement, real public booking flow. Merged to `main` (PR #12, by the owner) — production health not yet confirmed from this sandbox.** A real `/book` can't stay static (a booking has to hit the database to check availability and reserve), so this carries the same production risk the P1.3 note above documents: `/book`, `/account` and `/account/login` now require a reachable `DATABASE_URL` on every visit.
>
> **Note for future sessions:** this PR was deliberately titled "DO NOT MERGE until `DATABASE_URL` is wired in Vercel" and held open specifically because this sandbox's network policy blocks a raw Postgres connection to the Neon database (see the P1.1 and P1.3 notes above) — the same policy also blocks this sandbox from reaching the live Vercel deployment at all (`curl`/`WebFetch` to `*.vercel.app` both return `EGRESS_BLOCKED`). The owner merged it anyway (`merged_by` on PR #12 is the owner's own account), which most likely means they've wired `DATABASE_URL` into Vercel and migrated/seeded the database themselves — directly, outside this sandbox — the same way task #22 has been blocked from this side. But that is inference, not confirmation: **a future session should ask the owner to confirm the live site is healthy** (or check it from an environment that isn't network-restricted the same way) before assuming this phase is genuinely done, exactly the check the P1.3 outage note says not to skip.
- [x] `src/server/auth/otp.ts` (pure code generation/hashing, no `server-only` — same testable pattern as `totp.ts`/`password.ts`), `src/server/notify/sms.ts` (adapter interface + `console.ts`, selected by `SMS_PROVIDER`; the sandbox code is echoed back to the UI the same way the payment step is, since no real provider is chosen yet), `src/server/client-auth/` (`session.ts` — database-backed client session, mirrors staff `session.ts`; `dal.ts` — `requireClientPage`/`requireClientAction`; `actions.ts` — `requestOtp`, two verify paths that share OTP-checking logic but differ in what happens after: `verifyOtpForBooking` stays on the same page and returns state so the booking flow continues inline, `verifyOtpAndSignInAccount` redirects to `/account`)
- [x] `src/server/booking/actions.ts` — the public flow's Server Actions: `getSlotsAction` (live availability for a day), `beginPaymentAction` (creates the hold only once a client is signed in — an abandoned name/phone/code attempt never ties up a suite — then starts a sandbox charge), `confirmPaymentAction` (the sandbox "pay" step's stand-in for a provider webhook; renders the QR server-side via `QRCode.toDataURL` so the `qrcode` package never ships to the browser)
- [x] Real `/book` (`src/components/RealBookingFlow.tsx`): session → live day/time (`getDaySlots`) → name/phone → one-time code → health acknowledgement (first booking only, skipped for a returning signed-in client) → payment method → sandbox "pay" step → confirmation with the real booking reference and a real QR code. A signed-in returning client skips straight past the OTP step
- [x] Real `/account` and `/account/login`: phone + code sign-in, real upcoming/past bookings from `getBookingsForClient` — the pack-balance panel from the design preview is dropped rather than shown with fake numbers, since packs aren't built yet (Phase 2)
- [x] Fixed a real bug this surfaced: a Server Action call anywhere on the page (OTP request/verify, health ack) makes Next re-render the server component tree and hand `RealBookingFlow` a fresh `sessions` array with new object identities. The slots-fetching effect depended on the derived `session` object itself, so it silently re-fired on every one of those and cleared the client's already-chosen time slot. Fixed by depending on `session.uuid` (a stable primitive) instead — caught by testing the real multi-step flow end-to-end, not by the build or typecheck
- [x] Verified against a real Postgres: `pnpm build` succeeds both with and without `DATABASE_URL` reachable (with it reachable, `/book`, `/account` and `/account/login` correctly show as dynamic (`ƒ`) — every other public route stays static); 6 new pure unit tests (`otp.ts`, `pricing.ts`); a 15-assertion Playwright run through the entire real flow — session, live slots, name/phone, sandbox OTP, health acknowledgement, sandbox payment, a real confirmed booking with a real reference and QR image, signing out and back in with the same phone to see the booking on `/account`, and a returning signed-in visit skipping straight past OTP and health ack to payment — confirmed against the database directly (booking `confirmed`, `payment_received` ledger entry, QR token set)

**P1.5 — Confirmations, reminders, QR check-in, client self-service. Built and verified on the branch; not yet on `main`.** Needs migrations 0003 (`notifications`), 0004 (check-in cutover) and 0005 (`staff_users.password_changed_at`) applied to the production database right before it's deployed — see the note below.
- [x] Confirmation by email and WhatsApp with the signed QR as a PNG (`src/server/notify/`): console adapters selected by `EMAIL_PROVIDER`/`WHATSAPP_PROVIDER`, the same sandbox pattern as payments and SMS. Every send, failures included, is logged to a new `notifications` table (migration 0003), and staff see each booking's latest message status on the bookings board. Messages go out after the response (Next's `after()`), so a provider outage never blocks or undoes a paid booking. `/book` now takes an optional email
- [x] 24-hour and 2-hour reminders, each *claimed* by a conditional UPDATE before sending, so two overlapping job runs can't double-send; a booking made inside a reminder's own window doesn't get that reminder; the 2-hour one carries the QR again
- [x] No-show and completion jobs: a confirmed booking not checked in 15 minutes after its start becomes a no-show (money untouched, logged); a checked-in session whose time is up is completed and its suite moves to cleaning. All four jobs run from `/api/cron/tick` via `src/server/jobs/tick.ts`, each isolated so one failing never stops the others
- [x] QR check-in (`src/server/checkin/`): the signature, the stored token, "only on the day" (Kigali calendar), a window from 30 minutes before the start until the 15-minute no-show grace runs out (the same cut-off the no-show job uses, so the answer never depends on when it last ran), and "only once" — decided inside one transaction with the booking row locked, so two simultaneous scans can't both win. The suite goes to occupied in the same transaction; a guest whose suite is in maintenance is seated in a free one instead, leaving the maintenance flag alone. Every suite change that follows a booking (check-in, session end, a cancellation or refund while checked in) goes through `suiteState.ts`
- [x] `/staff/floor` (`bookings.checkIn`): a camera scanner (jsQR, loaded only when the camera starts), a field that also takes a USB/Bluetooth desk scanner's keystrokes, a preview before the one-tap check-in, and a suite board (who's in, who's next, "session finished", "cleaned, mark ready"). A manual check-in button on `/staff/bookings` covers a flat phone or a walk-in with no QR
- [x] Client area: `/account/bookings/[id]` shows the QR until the desk would stop accepting it, a receipt built from the ledger (paid, discount, refunded), and — per the draft policy — moving or cancelling. At least 4 hours before: free move to a time the booking page offers (checked on the server against the same live slots, never a posted time), or cancel with a full refund of what's still held (a new negative ledger entry, never an edit). Inside 4 hours: cancel only, forfeited. Desk bookings are changed at the desk, and their messages say so. Another client's booking id is a 404
- [x] Found and fixed along the way: a refund could exceed what the business still held after a discount (it was capped at the payment, not the ledger), and a discount could exceed the amount paid. Both now cap at the booking's net ledger balance
- [x] Fixed after two code reviews of the PR:
  - A staff refund landing at the same moment as a client's cancellation (or a second refund) could pay out twice. Every money change now locks the booking row first, and the payment only flips while it's still `succeeded`. Proven with a genuinely concurrent test that fails on the old code.
  - Moving a booking:
    - Accepted any posted time: closed hours, off the hourly grid, holidays, `25:00`. The same gap existed in `/book`'s payment step, and both now accept only a slot `getDaySlots` offers.
    - Was refused by an expired payment hold nobody had swept yet; the move now clears it first, like a new booking.
    - Showed the client's own time as "Taken".
    - Sent a reminder straight after the move message.
    - Needed a page reload to move twice.
  - Suites and check-in:
    - Cancelling or refunding a checked-in guest left their suite "occupied" with no way to clear it from the floor.
    - A floor status tap could overwrite a simultaneous check-in.
  - Jobs:
    - A walk-in seated without a separate check-in tap became a no-show; the walk-in form now checks them in as it books.
    - The first no-show run would have marked every pre-P1.5 booking as missed (migration 0004).
    - A bad message-provider setting stopped every scheduled job, not just reminders.
  - The staff board now says when a client's QR never reached them, even if a later reminder did.
- [x] Staff passwords (after the owner found the staff login and asked about it):
  - `/staff/password` to change your own, linked from the staff home. It needs the current password (wrong guesses count towards the login lockout) and signs out every other device.
  - Anyone on a password somebody else set is sent there after sign-in, and nothing else in the workspace opens until they've chosen their own (migration 0005). That's every seeded account.
  - `pnpm staff:password <email> [--temporary] [--reset-2fa]` sets a password from a hidden prompt, against whatever `DATABASE_URL` points at. It's the owner's way to claim or recover an account.
  - The seed refuses the public default password on anything but a local database.
  - `/admin`, the old mock-up with sample data and no real sign-in, now redirects to `/staff`.
  - Verified with 7 new vitest tests, the command run for every outcome (including in a real terminal, to check the password isn't shown), both builds, and a 26-assertion Playwright run. The run covers the forced first change, wrong, mismatched, short and public passwords refused, the old password refused afterwards, the other device signed out, nothing about the password in the activity log, and zero axe violations on `/staff/password`.
- [x] Verified:
  - 158 vitest tests against a real Postgres, 65 of them new for this phase. The refund and double-scan races run on a genuinely concurrent connection pool.
  - `pnpm build` with and without a reachable `DATABASE_URL`. The only new dynamic routes are `/staff/floor` and `/account/bookings/[id]`.
  - Two Playwright runs, 31 and 30 assertions, including:
    - A real camera scan through Chromium's fake video device, and the QR round-trip from confirmation screen to desk.
    - Forged and reused codes refused.
    - A walk-in checked in as it's booked.
    - Moving twice without a reload, the booking's own time marked "Your time", and quiet-hours-only slots.
    - A tampered posted time refused.
    - Both cancellation outcomes with their ledger entries.
    - Zero axe violations on `/account`, `/account/bookings/[id]`, `/staff/floor` and `/staff/bookings`.

> **Before P1.5 goes live — for the owner:**
> 1. **Run `pnpm db:migrate` against the production database right before deploying it.** Without migration 0003, `/staff/bookings` and `/staff/floor` fail, and confirmations can't be logged. Without 0005, no staff member can sign in. Migration 0004 records every session that started before check-in existed as completed; without it, the no-show job's first run would mark them all as missed. Run it close to the deploy, since a session starting in between is still unmarked. This sandbox can't reach the production database to do it (see the P1.3 note above).
> 2. **Something has to call `/api/cron/tick` every ~5 minutes** with `Authorization: Bearer $CRON_SECRET`, or reminders, no-shows and completions never happen (holds still self-heal on the next booking attempt). Vercel Cron more often than daily needs a paid plan — on the Hobby plan a more-frequent schedule fails the deploy, which is why no `vercel.json` schedule is committed. Instead, `.github/workflows/scheduled-jobs.yml` calls it every 5 minutes from GitHub Actions (free, since the repo is public) once three values are set: `CRON_SECRET` in Vercel (Production), the same value as a GitHub Actions **secret** `CRON_SECRET`, and a GitHub Actions **variable** `TICK_URL` (`https://<live domain>/api/cron/tick`). Until then each run skips quietly. A failed job fails the run, so GitHub's failure email is the alert.
> 3. **The four staff accounts from `pnpm db:seed` share a password that's written in this public repository** (`change-me-now`, unless `SEED_STAFF_PASSWORD` was set when seeding), and whoever signs in first sets up that account's two-step verification. Right after migrating, set each one's password from your own computer with `DATABASE_URL="<production>" pnpm staff:password <email>`; add `--reset-2fa` if you didn't set up that account's authenticator yourself. From this deploy on, anyone still on a password somebody else set is sent to choose their own at sign-in, and staff can change theirs any time at `/staff/password`. The seed no longer uses the public password on any database but a local one.
> 4. **Decide the reschedule rule.** As built, a client can move a booking free of charge, keeping the price they paid, to any time the booking page offers at least 4 hours away. A booking made at the quiet-hours price can only move to another quiet-hours time; for a peak time they cancel (free) and book again. A peak booking can move anywhere, with no partial refund if it moves into quiet hours. Easy to change in `src/server/booking/clientChanges.ts`.
> 5. Messages are still console-only: pick the email provider and get WhatsApp templates approved (Phase 0), then add real adapters beside the console ones.

- [ ] **P1.6** — Contact form and messages inbox (status, assignee, reply)
- [ ] **P1.6** — Reports: daily and monthly income by method and session type, bookings, clients, CSV export
- [ ] **P1.6** — EBM receipt number recorded per sale (receipts issued from RRA software at the desk)
- [ ] **P1.6** — Privacy notice page; marketing consent; client data export and deletion
- [ ] **P1.6** — Tests for the reporting rules still to come (booking, availability, payment, ledger, confirmation, reminder and check-in rules now covered — see P1.4a and P1.5 above); error monitoring; uptime alerts

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
- When a client moves a booking, may they move it from quiet hours into peak hours at the quiet-hours price they paid, or should that be refused as it is now? And should a peak booking moved into quiet hours get the difference back (it doesn't now)?
- Does cancelling inside the 4-hour window use up a pack credit? (Decision pack §2 — needed before packs, Phase 2.)

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
| 2026-09-25 | P1.3 | Built and merged the database read path (PR #6), then reverted it (PR #7) within minutes: it required a reachable `DATABASE_URL` in production, which Vercel doesn't have configured, and the live site went down. See the note above P1.3's checklist for what has to be true before re-landing it. Nothing about the code was wrong — `pnpm build` and a full local verification both passed — the gap was entirely in deployment configuration outside this repo | `d966b4c` (PR #6, reverted), `7a5ca72` (PR #7) |
| 2026-09-25 | P1.3 (2a) | Real admin editing for sessions/pricing (with price history) and location/hours/holidays/social links, staged safely this time: reintroduced the database read layer for staff-only routes without touching the public site's data source. Verified against a real Postgres with a 15-assertion Playwright run, including a Manager correctly blocked server-side from an Owner-only page; confirmed the public site is unaffected by an admin edit | `c61101f` (PR #9) |
| 2026-09-25 | P1.3 (2b) | Real admin editing for suites + maintenance blocks and website text + FAQs, same staged-safe pattern. Suites/maintenance split into two capabilities so Front desk can work the floor without touching pricing; the two structured content blocks and hygiene/visit-steps/shelf are editable as raw JSON for now. Verified against a real Postgres with a 25-assertion Playwright run, including the overlap-rejection on maintenance blocks and a Front desk role correctly scoped between the two new pages | `ee94dd0` (PR #10) |
| 2026-09-25 | P1.4 (a) | Availability engine (live slots, self-healing holds, the `bookings_no_overlap` exclusion constraint doing the real double-booking guarantee), the sandbox payment adapter, HMAC-signed QR tokens, add-only ledger refunds/discounts, `/api/cron/tick`, and a staff booking board for walk-ins, cancellations, refunds and discounts — each gated by its own capability. Money/availability logic takes `db` as a parameter instead of importing the app singleton, following P1.2's `lockout.ts` precedent, so it's directly unit-testable: 41 new tests against a real Postgres plus a 20-assertion Playwright run covering the capability matrix across Front desk and Finance. The public client-facing booking flow (phone/OTP, health acknowledgement, the real `/book`) is part b, held back the same way P1.3 part 1 is — see the note above | `2c23fa6` (PR #11) |
| 2026-09-25 | P1.4 (b) | Client phone + one-time-code sign-in, health acknowledgement, and the real public `/book` and `/account` flows — every step (live availability, name/phone, code, health check, sandbox pay, a genuinely confirmed booking with a real reference and QR) now talks to the database instead of simulating client-side. Caught and fixed a real bug along the way: a Server Action anywhere on the page made Next re-render the server tree and hand down a fresh `sessions` array, which was silently clearing an already-chosen time slot until the effect's dependency was changed to a stable primitive. Verified locally against a real Postgres — `pnpm build` succeeds with and without `DATABASE_URL` reachable, 6 new unit tests, a 15-assertion Playwright run through the entire real flow including sign-out/sign-in and a returning-client fast path. PR opened with an explicit "do not merge until `DATABASE_URL` is wired in Vercel" gate; the owner merged it directly shortly after (see the note above) — this sandbox can't reach the live deployment to confirm it's actually healthy there | `43c1949` (PR #12) |
| 2026-09-26 | P1.5 | Booking confirmations and reminders by email and WhatsApp with the signed QR (console adapters, every send logged to a new `notifications` table), no-show and session-completion jobs, QR check-in with a camera scanner and a suite board for the desk, and client self-service on `/account/bookings/[id]`: QR, receipt, move or cancel within the 4-hour policy through the ledger. Also capped refunds and discounts at what a booking still holds. 144 vitest tests against a real Postgres, both builds, 56 Playwright assertions including a real camera scan. Needs migration 0003 on production and a scheduler for `/api/cron/tick` — see the note under P1.5 | `47814a4`, `b833271` (PR #14, open — waiting on migrations 0003–0005 in production) |
| 2026-09-26 | P1.5 | Staff passwords. There's a change-password page, and anyone still on a password somebody else set (every seeded account) must choose their own at sign-in (migration 0005). `pnpm staff:password` sets or recovers any account from the command line. The seed no longer uses the public default outside a local database. `/admin` now redirects to `/staff`. Also scheduled `/api/cron/tick` from GitHub Actions. 165 tests, both builds, Playwright runs of 26, 31 and 30 assertions | (this commit, PR #14) |
| 2026-09-26 | P1.5 | Fixes from two code reviews of PR #14. **Money:** concurrent refunds could pay out twice; refunds and discounts now lock the booking row. **Moves:** a move could land on any posted time, including closed hours (and so could `/book`); an unswept expired hold could block it; a moved booking got an immediate reminder; the form showed the client's own time as taken. **Suites:** cancelling or refunding a checked-in guest stranded their suite as occupied. **Check-in:** it now has a time window and seats a guest elsewhere when their suite is in maintenance. **Walk-ins:** they can be checked in as they're booked. **Migration 0004:** backfills pre-check-in bookings so the first no-show run doesn't mark them missed. **Scheduled jobs:** a bad message-provider setting no longer stops them. **Staff board:** it flags a QR that never arrived. 158 tests, both builds, 61 Playwright assertions | (this commit, PR #14) |
