---
name: ui-ux-design
description: >-
  Comprehensive UI/UX design system principles, luxury aesthetic guidelines, typographic hierarchy, motion physics, and accessibility standards. Use when designing, refining, or auditing high-end web applications.
---

# UI/UX Design System & Luxury Aesthetics Guide

This skill guides the design, evaluation, and refinement of user interfaces, with special emphasis on high-end, luxury, and wellness brands characterized by editorial elegance, warm minimalism, and cognitive ease.

---

## 1. Core Design Philosophy: Quiet Luxury & Warm Minimalism

* **Intentional Restraint:** Space is content. Resist filling empty space; give elements room to breathe.
* **Warm Organic Palette:** Avoid pure stark whites (`#ffffff`) or pure digital blacks (`#000000`). Use tactile, paper-like surfaces (`#faf8f4`, `#efeae1`), deep forest inks (`#1c3528`), muted botanical sages (`#7fa28d`), and soft bullion accents (`#d4af37`).
* **Editorial Typographic Harmony:**
  * **Headings:** High-character serif (e.g. *Lora*, *Playfair*, *Cormorant*) or ultra-clean geometric sans with light weights (300) and tight negative tracking (`-0.015em`).
  * **Body:** Highly readable humanist or modern sans (e.g. *DM Sans*, *Inter*) with generous line-height (`1.7`–`1.85`) and maximum line length of 60–65 characters (`65ch`).
  * **Labels & Eyebrows:** Small uppercase text (11px–12px) with expansive tracking (`0.18em`–`0.24em`) and medium weights (500).

---

## 2. Spatial Rhythm & Fluid Proportions

* **Base Unit:** 4px / 8px grid system.
* **Fluid Clamp Scaling:** Ensure layouts adapt smoothly between small mobile viewports and ultrawide screens:
  * Section padding: `clamp(80px, 12vw, 160px)`
  * Horizontal gutter: `clamp(24px, 6vw, 64px)`
  * Display titles: `clamp(36px, 7vw, 72px)`
* **Touch Target Ergononics:** All clickable elements (buttons, links, checkboxes, calendar days) must have a minimum hit area of `44px × 44px`.

---

## 3. Micro-Interactions & Motion Physics

* **Custom Easing:** Never use linear or abrupt transitions. Use organic decelerations:
  * `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)`
  * `--duration: 250ms` (standard interactions), `350ms` (structural shifts), `700ms` (image pans).
* **Feedback States:**
  * **Default:** Clean, unhurried, grounded.
  * **Hover:** Subtle upward translation (`translateY(-1px)`), gentle color saturation, or image micro-zoom (`scale(1.025)`).
  * **Active/Pressed:** Downward micro-settle (`scale(0.99)`).
  * **Focus-Visible:** Unapologetic, high-contrast outline (`2px solid var(--gold)`, `outline-offset: 3px`).
* **Respect Reduced Motion:** Honor `@media (prefers-reduced-motion: reduce)` by bypassing all non-essential transforms.

---

## 4. Conversion & Form UX Heuristics

* **Progressive Disclosure:** Break complex processes (like booking or checkout) into manageable, single-focus steps with clear step indicators.
* **State Persistence:** Preserve form entries across accidental tab closes or refreshes (`sessionStorage`).
* **Context Preservation:** Pass intent from marketing CTAs directly into transaction workflows via query parameters.
* **Instant Reassurance:** After form submission, provide concrete artifacts (reference codes, calendar downloads, summary printouts, unambiguous payment terms).

---

## 5. Accessibility (WCAG 2.1 AA / AAA)

* **Contrast:** Minimum 4.5:1 for standard body text, 3:1 for large display headings and UI components against their backgrounds.
* **Semantic Hierarchy:** Single `<h1>` per page, sequential `<h2>` and `<h3>` tags without skipping levels.
* **ARIA Integrity:**
  * Modals: `role="dialog"`, `aria-modal="true"`, trapped focus, escape key listener.
  * Accordions: `aria-expanded`, `aria-controls` pointing to panel `id`, panel `role="region"`.
  * Form errors: `aria-invalid="true"`, `aria-describedby` linking input to error message.
