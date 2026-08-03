# Implementation Guide — beyond the static preview

The files in this package are a **working reference implementation**, not the thing you should deploy verbatim. Everything the design specifies is in the HTML/CSS; what's missing is routing, data loading and backend wiring.

Read `HANDOFF.md` first for the blocking issues and design tokens. This document covers turning the preview into a real application.

---

## 1. Content is available as data

`content/posts.json` — all 17 articles as structured JSON. This is the source of truth; the HTML files are a rendering of it.

```json
{
  "posts": [
    {
      "slug": "2026-04-30-upc-list-insights",
      "title": "UPC List Insights That Clean Data and Drive Results",
      "dek": "Better item data. Fewer errors...",
      "category": "Module Spotlight",
      "author": "CounterCtrl Cloud",
      "date_display": "April 30, 2026",
      "hero_image": "upc-hero.webp",
      "body_paragraphs": ["…", "…"]
    }
  ]
}
```

Sorted newest first. `hero_image` is `null` for the 4 posts without artwork, and otherwise a filename inside `blog/assets/`.

**Import this into your CMS or database rather than hand-copying from HTML.** Suggested schema:

```
posts
  id, slug (unique, indexed), title, dek, category,
  author, published_at (timestamp — see note below),
  hero_image_id (fk, nullable), body (markdown or html),
  status (draft|published), created_at, updated_at
```

⚠️ `date_display` is a formatted string ("April 30, 2026") because that's all the design needed. Parse it into a real timestamp on import — you'll want to sort and filter on it.

---

## 2. Routes to create

| Route | Renders | Notes |
|---|---|---|
| `GET /` | Portal + sign-in | The marketing page. Public. |
| `POST /auth/login` | — | Sign-in. Returns to `/` on failure with an error state (not currently designed — you'll need one). |
| `GET /auth/forgot` | Password reset | Referenced by "Forgot password?", currently `href="#"`. |
| `GET /field-notes` | Blog index | Currently `blog/index.html`. Paginate if the post count grows. |
| `GET /field-notes/:slug` | Single article | Currently `blog/2026-*.html`. 404 on unknown slug. |
| `POST /api/walkthrough` | — | Walkthrough request form. |
| `POST /api/support` | — | Support request form. |
| `GET /assets/*` | Static | Long cache headers — these never change. |

Optional but worth it: `GET /field-notes/feed.xml` (RSS), `GET /sitemap.xml`.

**Slug format is `YYYY-MM-DD-title-words`.** Dates are baked into the URL. If you'd rather have clean slugs (`/field-notes/upc-list-insights`), change it now and set up redirects — not after these URLs are shared.

---

## 3. Form endpoints

Both forms currently validate client-side, show a fake confirmation, and send nothing.

### `POST /api/walkthrough`

| Field | ID in markup | Required |
|---|---|---|
| name | `dName` | ✅ |
| company | `dCo` | ✅ |
| email | `dEmail` | ✅ |
| phone | `dPhone` | |
| role | `dRole` | |
| locations | `dLoc` | |
| pos_system | `dPos` | |
| interest | `dWant` | |
| notes | `dNote` | |

### `POST /api/support`

| Field | ID in markup | Required |
|---|---|---|
| name | `sName` | ✅ |
| company | `sCo` | ✅ |
| email | `sEmail` | ✅ |
| location | `sLoc` | |
| phone | `sPhone` | |
| urgency | `sUrg` | |
| issue_type | `sType` | ✅ |
| message | `sMsg` | ✅ |

**Both need, on the server:**
- Re-validation (client-side checks are a convenience, not a control)
- Spam protection — honeypot field or CAPTCHA. These are public, unauthenticated endpoints.
- Rate limiting per IP
- Persistence *before* notification, so a mail failure doesn't lose the lead
- A real error state in the UI — currently there's no path for "submission failed"

The client code is marked with `/* DEV: POST … */` at the exact insertion points.

---

## 4. Replacing the embedded article data

In `index.html` the Field Notes panel reads from a `var POSTS = [...]` array so the preview works as a single file. In production, fetch it:

```js
const res = await fetch('/api/field-notes');
const POSTS = await res.json();
renderList();
```

The render functions (`renderList`, `renderArticle`) don't care where the data comes from — they only need the same field names (`s`, `d`, `c`, `a`, `t`, `k`, `b`, `im`).

⚠️ **Those functions build HTML by string concatenation and assign via `innerHTML`.** That is safe today because the content is authored by your team. The moment it comes from a CMS with multiple editors, escape on output or switch to DOM construction — otherwise a post title containing markup becomes stored XSS.

---

## 5. Images

`blog/assets/` — 27 WebP files, ~1.3MB total. Referenced by filename from `posts.json`.

Two things to fix before launch:

**They're crops from composite brand sheets.** Each carries baked-in headline text and **the older all-caps logo**, which no longer matches the current mixed-case mark. Re-export individually at full resolution from the source files.

**No responsive variants.** Single size each, served to phones and desktops alike. Generate 400/800/1200 widths and use `srcset`, or put a CDN with on-the-fly resizing in front.

Also worth adding: real `alt` text (currently empty), and explicit `width`/`height` attributes to prevent layout shift.

---

## 6. What isn't built

Be aware these were never in scope:

- **Authentication** — no session handling, no roles, no password reset flow
- **The application itself** — this is the front door only; everything behind sign-in is separate
- **CMS** — no admin UI for publishing posts
- **Error pages** — no 404, no 500
- **Cookie consent** — needed if you add analytics and have EU traffic
- **Email delivery** — no templates for form notifications or auto-replies

---

## 7. Testing checklist

- [ ] Both forms submit, persist, and notify the right inbox
- [ ] Both forms show a real error state when the request fails
- [ ] Sign-in succeeds, fails gracefully, and rate-limits
- [ ] Every article route resolves; unknown slugs 404
- [ ] Panels open/close on click, Esc and scrim — and trap focus (not currently implemented)
- [ ] Keyboard-only navigation reaches every control
- [ ] Screen reader announces panel open/close
- [ ] Layout holds at 320px, 768px, 1024px, 1440px, 1920px
- [ ] Contrast passes WCAG AA (unverified — check `--slate` on `--bg` and the 9.5px mono labels)
- [ ] Carousel stops for `prefers-reduced-motion`
- [ ] Lighthouse ≥90 on performance and accessibility
