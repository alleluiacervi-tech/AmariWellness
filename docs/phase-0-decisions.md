# Phase 0 — the owner's decision pack

Companion to the Phase 0 checklist in `CLAUDE.md`. Everything here is prepared
so you can decide quickly; nothing here commits you to anything. Where the
decision is legally or financially yours to make, I've said so and left it
open rather than guessing.

---

## 1. Payment provider comparison

None of these figures are final — providers change pricing and I could not
get an exact fee schedule for Rwanda without a business logging into their
merchant portals. Treat every fee below as "ask them to confirm in writing,"
not as a quote.

| Provider | Covers | What stands out | Open questions |
|---|---|---|---|
| **Flutterwave** | MTN MoMo, Airtel Money, cards (Visa/Mastercard), bank transfer, USSD — one API for everything | Largest pan-African processor by volume; local settlement in ~24h; the best-documented API of the four, which matters for how fast Phase 1 can be built and how safely it can be tested | Exact Rwanda fee schedule; whether settlement lands in a Rwandan bank account or requires a multi-currency wallet |
| **Paypack** | MTN MoMo, Airtel Money (Rwanda-built, mobile-money-first) | Rwanda-native, developer-first docs (`docs.paypack.rw`), likely the simplest for mobile-money-only volume | Whether it covers cards at all (unclear from public docs); pricing not published |
| **DPO Pay** | MTN MoMo, Airtel Money, cards, multi-currency (RWF/USD/GBP) | Has a support team physically in Kigali; strong in travel/hospitality, which is a similar booking-and-payment shape to Amari | Fee schedule; onboarding time |
| **Pesapal** | M-Pesa, Airtel Money, cards, in-store and event payments | Treats mobile money as first-class rather than bolted onto a card platform; established across East Africa | Rwanda-specific MTN MoMo coverage (search results emphasise M-Pesa/Airtel, less clear on MTN); fee schedule |

**Recommendation:** request a merchant quote from **Flutterwave** and
**Paypack** in parallel.

- Flutterwave as the default if you want one contract covering mobile money
  and cards, with faster settlement and the most mature API.
- Paypack as the local-first, mobile-money-only alternative if their fees
  come in meaningfully lower — worth asking since almost all Amari
  transactions will be MoMo/Airtel, not cards.
- DPO and Pesapal are reasonable fallbacks if either of the above turns out
  to have a dealbreaker (KYC requirements, settlement account type, etc.).

**Why the build doesn't wait on this:** Phase 1's payment code is written
against one internal interface — "start a payment," "confirm a payment,"
"a payment failed" — with a provider-specific adapter behind it. Today that
adapter is a sandbox one that behaves like a real provider but moves no real
money (see `src/server/payments/`). Switching to a real provider later is
adding one adapter and its API keys, not changing how bookings, the ledger,
or confirmations work.

**What I need from you once you've chosen:** the provider's sandbox (test)
API keys, so Phase 1 can be built and tested against something close to the
real integration before you ever hand over production keys.

Sources: [Flutterwave mobile money docs](https://developer.flutterwave.com/docs/mobile-money) · [Flutterwave pricing](https://flutterwave.com/ng/support/pricing/pricing-for-receiving-payment) · [Paypack docs](https://docs.paypack.rw/) · [Paypack](https://paypack.rw/) · [DPO Pay Rwanda](https://dpogroup.com/online-payments/rwanda/) · [Payatlas: accepting payments in Rwanda](https://payatlas.com/countries/rwanda-rw) · [Kisimenti: mobile money for business in Rwanda 2026](https://kisimenti.com/en/times/rwanda-mobile-money-for-business-2026)

---

## 2. Draft cancellation & no-show policy

The website already promises free cancellation up to 4 hours before a
session. Drafted so the system has an exact rule to enforce — edit and
approve, or replace:

> - Cancel or reschedule free of charge up to **4 hours** before your
>   session, from your confirmation link or by messaging the desk.
> - Cancelling **inside 4 hours**: a single session is forfeited; a pack or
>   voucher session is **not** deducted from your balance (you keep the
>   credit) — *or* is deducted (your choice; this is a business call, not a
>   technical one).
> - **No-show** (not cancelled, not arrived within 15 minutes of the start
>   time): the session is forfeited and, for a pack, one credit is used.
> - Amari may cancel or move a booking for maintenance or an emergency; in
>   that case you are never charged and any pack credit used is restored.

**Decision needed:** does cancelling inside 4 hours use up a pack credit, or
not? This changes one line of logic in Phase 1 and is worth deciding once.

---

## 3. Draft privacy notice (for the website footer)

A short, plain-language draft to review with whoever handles your data
protection registration. Not legal advice — Rwanda's Law No. 058/2021 on
personal data protection should be checked by a lawyer or the National
Cyber Security Authority before this goes live.

> **Privacy at Amari**
>
> When you book, we collect your name, phone number, and — if you give it —
> your email. We ask a short health question before your first visit so we
> can keep you safe in the chair. We use your phone number to hold your
> booking, your pack balance, and your booking history.
>
> We never sell your information. We share it only with the payment
> provider that processes your payment, and with WhatsApp or your email
> provider to send your confirmation.
>
> We keep your booking history so you can see it when you return. You can
> ask us at any time, via WhatsApp or email, to see what we hold about you
> or to delete it — reply "delete my data" and we will remove it within 30
> days, except where we are required to keep payment records for tax
> purposes.
>
> We will only message you about offers if you say yes when you book, and
> you can opt out at any time.

**Decisions needed:** who is the registered data controller (the business
entity's legal name), and a contact address/email for data requests to
replace the generic "message us" line above if you want a named contact.

---

## 4. What Phase 1 needs from you to configure, not build

These become environment variables / admin settings — none of them are code
changes, so they don't block Phase 1 starting. A placeholder is used until
each is supplied:

- [ ] Final brand name and domain (site currently assumes `amari.rw`)
- [ ] Real business phone number and WhatsApp Business number
- [ ] Instagram handle
- [ ] Confirmed address and Google Maps Plus Code
- [ ] Final prices per session length (VAT-inclusive) and the quiet-hours window
- [ ] Cancellation policy decision (section 2)
- [ ] Payment provider + sandbox keys (section 1)
- [ ] WhatsApp Business Cloud API access (for confirmations — Meta approval
      can take a few days, so worth starting early)
- [ ] A sending domain for confirmation emails (e.g. `book@amari.rw`), or
      confirmation this can start on a shared domain for now
- [ ] Data controller name/contact for the privacy notice (section 3)
- [ ] Real photography, to replace the Pinterest placeholders in
      `src/data/images.ts`

None of these need to be finished before Phase 1 code starts — they're
plugged in as they arrive. The two that are worth starting **now** because
they have lead time outside our control: WhatsApp Business API approval, and
getting quotes from Flutterwave/Paypack.
