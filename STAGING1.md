# Staging1 — parallel staging environment

This branch carries the **repositioned LiteCone site** (the `v4 Enterprise`
variant from `litecone-preview-v13.zip`). It is deliberately isolated:
`staging` and `main` are untouched by anything that happens here.

Amplify serves whichever branches are connected in the console. Connect
`Staging1` there to get its own URL; it builds independently of every other
branch.

## What this build is

23 pages plus a 404, all from the v4 variant:

- `index.html`, `coworkers.html`, `co-decision.html`, `how-it-works.html`,
  `platform.html`, `pricing.html`, `calculator.html`, `company.html`, `contact.html`
- AI Co-workers: `leo` `eric` `aura` `aris` `alex` `rio` `elsa` `iris` `marc`
- Industries: `insurance` `capital-markets` `credit-unions` `lending`
- `print-all.html` — the print pack, deliberately `noindex`

## What was changed from the zip

**Theme.** The variant shipped light-only with an Archivo/Instrument Serif
type stack. `style.css` now carries the LiteCone token system: dark by
default, light via `prefers-color-scheme` **and** a `data-theme` toggle that
persists in `localStorage` under `lc-theme` — the same key the live site uses.
The variant's original variable names (`--paper`, `--soft`, `--or` …) are
aliased onto the LiteCone tokens, so every rule in the file rethemes at once.
Fonts are Bree Serif (display), Inter (body/UI) and IBM Plex Mono (labels).

Small orange text uses `--or-ink` (the contrast-tuned value), never `--or`,
so it clears WCAG AA in the light theme.

**Forms.** The zip shipped a dead stub (`onsubmit="return false"`, no `name`
attributes). Both the contact-page form and the site-wide briefing modal are
now wired to the same two delivery paths as the live site — `SHEETS_ENDPOINT`
first, `LEAD_ENDPOINT` as fallback (see `LEADS-SETUP.md`). They collect first
name, last name, work email, mobile, institution, track, country and the
workflow note, and enforce the house rules: required fields, official work
email only (free mailboxes rejected), and a valid mobile number.

**SEO.** Every indexable page carries a canonical URL, Open Graph and Twitter
card tags, a `WebPage` JSON-LD node (plus `BreadcrumbList` on subpages, and
`Organization` + `WebSite` on the homepage), the `theme-color` pair and
favicon links. `noindex` was removed from all of them and `sitemap.xml`
regenerated with 22 URLs.

**Accessibility.** Skip link, `<main id="main">`, `:focus-visible` outlines,
`aria-expanded` on nav dropdowns with Escape and outside-click handling,
modals with `role="dialog"`, focus trap and focus restore, `aria-invalid`
plus `aria-describedby` on field errors, `role="alert"` on send failures, and
a global `prefers-reduced-motion` fallback.

**Security.** `amplify.yml` sets HSTS, `X-Content-Type-Options`,
`X-Frame-Options: DENY`, `Referrer-Policy`, a locked-down `Permissions-Policy`,
COOP/CORP, and a **Content-Security-Policy with no `unsafe-inline` for
script**. Executable page scripts live in `site.js`, `index.page.js` and
`calculator.page.js`; the only inline script is the theme boot, allow-listed
by SHA-256 hash. Forms carry a honeypot field and a submit-timing gate, all
inputs have `maxlength`, and off-site links get `rel="noopener noreferrer"`.

> **If you edit an inline `<script>` or the JSON-LD, the CSP hash list in
> `amplify.yml` must be regenerated**, or the browser will block that block.

## Canonical URLs and indexing

Page-level SEO tags point at `https://litecone.ai/...` so they are correct the
day this is promoted. Because this branch is *staging*, `robots.txt` is
`Disallow: /` — the preview must never be indexed alongside production. Delete
that rule only when this build becomes the production site.

## Still open, from the pack's own README

- NOVA, VERA and CASS are proposed agent names, not real ones.
- Agent statuses are placeholders except LEO's.
- "350+ engineers" and "40+ implementations" are carried over from lumiq.ai.
- Data Rover's naming and scope were never confirmed.
