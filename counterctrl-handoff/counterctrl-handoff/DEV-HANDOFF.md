# CounterCtrl Cloud — Login Portal · Production Handoff

Everything below is **backend / infrastructure work that was deliberately left out** of `index.html`.
The front end is finished and marked: every spot needing wiring has a `PROD:` comment block
sitting exactly where the code goes.

---

## 1. Wire the sign-in form — BLOCKING

**File:** `index.html`, script block, search `PROD: replace everything below with the real auth call`

The markup is now a real `<form id="signin">` with `name="username"`, `name="password"`,
`name="remember"`. Enter submits. The submit handler already does client-side validation, sets
`aria-busy` on the button (spinner state is styled), and writes to `#authErr` (a `role="alert"`
region). A commented-out `fetch()` skeleton is in place — drop in the real endpoint.

Still needed server-side:

- `POST /api/auth/login` returning a session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`) and a redirect target
- Distinct handling for: bad credentials, locked account, expired password, MFA required
- Rate limiting / lockout after N failed attempts, plus the copy for the locked state
- CSRF token in the form if the session is cookie-based
- Server-side redirect to `/dashboard` for an already-authenticated session hitting `/`

**Do not** reuse the placeholder error string — it currently says "Preview build — authentication
is not connected yet," which is correct today and wrong the moment this ships.

## 2. Move `POSTS` out of the document — BLOCKING for performance

The inline array is **333 KB** (17 posts + 299 KB of base64 images) and downloads before anyone
can type a password.

Shipped alongside this file:

- `posts.json` — 35 KB, the same array with `im` rewritten to `/assets/post-{slug}.webp`
- `assets/` — 13 extracted post images, 224 KB total

The swap is marked in `index.html` directly above `var POSTS=` with the exact lazy-load
replacement. Fetch on first open of Field Notes, not on page load.

Result: **574 KB → ~240 KB.** Pull the remaining data-URIs (logo, stage watermark, notes mark,
About diagram, slide-7 screenshot — 5 blobs, ~150 KB) out to files and it lands **near 60 KB**.

While you're there: serve the images as `.webp` with width variants, add `loading="lazy"` to the
Field Notes thumbnails, and cache `posts.json` with an ETag.

## 3. Wire the two lead forms — BLOCKING (reputational)

**Walkthrough:** search `PROD: POST to the CRM / form endpoint`
**Support:** search `PROD: POST to the ticketing system`

Both currently render a green checkmark and "Request received" / "Request sent" while sending
nothing. If this ships as-is, prospects and locked-out customers will believe DCR has their
request. Only call `showDone(...)` on a 2xx.

Needed:

- Endpoints (CRM for walkthrough, ticket queue or support inbox for support)
- Spam control — honeypot field or Turnstile/reCAPTCHA; these are public unauthenticated forms
- Server-side validation mirroring the client rules
- Failure path: keep the entered values, show the error, don't wipe the form
- Autoresponder confirming receipt

## 4. Forgot password

Currently opens the Support panel with "I can't sign in" pre-selected — a stopgap, not the
answer. Point `#forgot` at the real reset flow once it exists (`/reset` or your IdP's endpoint).
Keep the support route as the fallback for accounts that can't self-serve.

## 5. Hosting, headers, meta

- Force HTTPS + HSTS
- CSP — the file uses inline `<style>` and `<script>`, so either extract them or ship a nonce.
  Worth doing when you externalize the assets anyway.
- `X-Frame-Options: DENY` (a login page should never be framable)
- Replace the placeholder `og:image` (`/og-counterctrl.png`, 1200×630) and the `canonical` URL —
  I guessed `https://counterctrl.cloud/`
- Favicon is an inline SVG data-URI so the file stays self-contained; swap for real
  `favicon.svg` + `apple-touch-icon.png` when hosted
- Self-host the three Google fonts if you want to drop the third-party request entirely
- `Field Notes → "Open the full blog →"` points at the relative path `blog/index.html` — confirm

## 6. Version string

The gate footer now reads `CounterCtrl Cloud · v2026.08` (it previously showed
`Last updated 7/27/2026 @ 3:35 PM CST`, which meant nothing to a store manager — and July is
CDT). Wire it to your build number, or drop it.

## 7. Analytics

None present, by design. If you add it, keep it off the critical path and out of the way of the
sign-in submit.


## 8. Search / SEO

Handled separately in `SEO-IMPLEMENTATION.md`, but two items overlap with the work above and are
worth knowing before you start:

- **Moving `POSTS` out of the document (item 2) is also the biggest SEO win.** Those 17 posts are
  currently invisible to crawlers. `scripts/build-blog.mjs` turns `posts.json` into 17 real,
  indexable URLs. Same task, two payoffs.
- **The `/` vs `/login` split** (listed as optional above) is a prerequisite for ranking on
  anything. A page whose `<title>` is "Sign in" cannot rank for "grocery analytics software", and
  shouldn't. Once split, `/login` gets `<meta name="robots" content="noindex,follow">`.

---

## Optional, worth a conversation

- **Split the audience.** One page currently serves customers signing in and prospects
  evaluating. Those want opposite things. A separate `/product` page would let the login column
  be the whole login page — and would solve the weight problem outright.
- ~~Cut the carousel to four slides.~~ **Done.** Now four slides at 6s (24s total): What it is /
  What you can do / How it grades / Who it's for. "How far it goes" moved into the About panel as
  its own section; "About us" was already there verbatim; the Item Scan post slide came out and
  its Field Notes CTA moved onto the last slide. Slide count is read from the DOM, so adding or
  removing a `.slide` needs no JS change — only the `aria-label="N of 4"` attributes.
- **SSO / SAML** if any of the larger groups ask for it.
