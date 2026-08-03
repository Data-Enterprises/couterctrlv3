# CounterCtrl Cloud — Public Portal · Developer Handoff

**Version:** review build, 31 Jul 2026
**Contact for content questions:** Tommy
**Status:** front-end complete and self-contained. Nothing is wired to a backend. Do not ship as-is — see *Must fix before launch*.

---

## 1. What this is

A public landing page and member sign-in for CounterCtrl Cloud, plus a Field Notes blog. Everything is static HTML/CSS/vanilla JS — no build step, no framework, no dependencies beyond Google Fonts.

```
counterctrl-site/
├── index.html          Portal: sign-in, carousel, 4 slide-over panels
└── blog/
    ├── index.html      Field Notes landing (17 posts)
    ├── 2026-*.html     17 article pages
    └── assets/         27 WebP images
```

Open `index.html` directly in a browser — it works offline with no server.

---

## 2. Must fix before launch

These are blocking. The page looks finished but silently drops data.

| # | Issue | Where | What's needed |
|---|---|---|---|
| 1 | **Walkthrough form doesn't submit** | `index.html` ~line 1047 | Form validates and shows a confirmation, but never POSTs. Wire to CRM/form endpoint. Marked `/* DEV: POST these values… */` |
| 2 | **Support form doesn't submit** | `index.html` ~line 1098 | Same problem. Wire to ticketing system or support inbox. Marked `/* DEV: POST to your ticketing system… */` |
| 3 | **Sign-in form is non-functional** | `index.html` | No auth. Username/password/remember-me need to POST to the real auth endpoint; needs CSRF protection and error states (bad credentials, locked account). |
| 4 | **"Forgot password?" goes nowhere** | `index.html`, `href="#"` | Point at the real reset flow. |
| 5 | **"Book a walkthrough" CTA in 17 article pages** | `blog/*.html`, marked `DEV: point at the real demo request form` | Currently links back to `../index.html`. Point at the real form, or open the same panel. |

**Confirmation states are cosmetic.** Both forms display "Thanks, [name]" without sending anything. If this ships unwired, users will believe they've contacted you.

---

## 3. Should fix before launch

**Images are base64-inlined.** `index.html` is ~574KB because 13 blog images and the logo are embedded as data URIs. This was done so the file could be emailed standalone. For production, extract to `/assets/` and reference by URL — the browser then caches them and the HTML drops to ~60KB. The same images already exist as files in `blog/assets/`.

**Logo is raster, not vector.** Currently a WebP cutout of a PNG. Ask design for the SVG — sharper on retina, smaller, and it recolors cleanly.

**No favicon, no meta/OG tags on `index.html`.** The article pages have OG tags; the portal doesn't. Add before anyone shares the link.

**No analytics.** Nothing is instrumented.

---

## 4. Content that needs sign-off

| Item | Where | Note |
|---|---|---|
| **UPC List post** | `blog/2026-04-30-upc-list-insights.html` | **Written by AI, not by the team.** Drafted from the brand graphic's claims. Must be read and approved before publishing. Verify the description of how UPC List actually behaves. |
| Company facts | About panel | Founding year, HQ and leadership deliberately omitted — no source. Marked `DEV: add founding year, HQ or leadership…` |
| "Built by DCR POS" | About panel | Public naming of the POS parent. Confirm this is wanted on a page prospects on competing systems will read. |
| Blog dates | Everywhere | 16 posts dated 2–20 March, one 30 April. A blog that stops reads as abandoned. Either continue it or drop visible dates. |
| Post images | 13 of 17 posts | Cropped from composite brand sheets, so they carry baked-in text and **the older all-caps logo**. Re-export individually at full res with the current mixed-case mark. |

---

## 5. How the JavaScript works

All in one `<script>` at the bottom of `index.html`. No modules, no bundler.

**Carousel** — 7 slides, 7s auto-advance (`DUR` constant). Pauses on hover, resumes on leave. Arrow keys navigate. Respects `prefers-reduced-motion` (no autoplay).

**Four slide-over panels**, all the same pattern — a scrim div plus an `<aside>`, toggled by an `.open` class:

| Panel | Opened by | IDs |
|---|---|---|
| Field Notes | `#openNotes` | `#notes`, `#nsScrim` |
| About | `#goAbout` | `#aboutPanel`, `#abScrim` |
| Walkthrough | `.js-demo` (3 buttons) | `#demoPanel`, `#dmScrim` |
| Support | `#support` | `#supportPanel`, `#spScrim` |

All close on ✕, scrim click, or Esc.

**Field Notes reader** — all 17 articles are embedded in a `var POSTS` array as structured data (`s`=slug, `d`=date, `c`=category, `a`=author, `t`=title, `k`=dek, `b`=paragraph array, `im`=optional image). Clicking a headline swaps the panel to a reader view in-place; no navigation. Replace `POSTS` with a CMS fetch when there is one — the render functions don't care where the data comes from.

⚠️ **Article HTML is built by string concatenation and inserted via `innerHTML`.** Safe now because the content is authored. If `POSTS` ever comes from a CMS with untrusted input, escape it or switch to `textContent`.

**Two important gotchas:**
- The script sits at the bottom and uses `getElementById` with no `DOMContentLoaded` guard. **Any markup moved below the `<script>` tag will break it** — this already happened once. Wrap in `DOMContentLoaded` if you touch the structure.
- Nav items are `<button>`, not `<a href="#">`, deliberately. Anchors triggered a navigation warning in preview. Keep them as buttons.

---

## 6. Design tokens

Defined as CSS custom properties in `:root`, mirrored across all pages.

```css
--navy:    #0F2440   /* headings, body, primary buttons */
--navy-2:  #1B3A63   /* navy hover */
--green:   #1E9E52   /* accent, CTAs, rules */
--green-d: #17803F   /* green hover, small text on white */
--green-t: #EAF7EF   /* green tint background */
--amber:   #D97706   /* Watch grade */
--red:     #E11D48   /* Critical grade */
--slate:   #5A6C84   /* secondary text */
--line:    #DCE5EF   /* hairlines */
--line-2:  #C8D5E4   /* input borders */
--bg:      #F4F7FB   /* page background */
--paper:   #FAFCFE   /* subtle panel fill */
```

**Type:** Plus Jakarta Sans (headings, 700/800, tight tracking) · Inter (body) · IBM Plex Mono (labels, data, timestamps — always uppercase with wide letter-spacing).

**Grading colors are semantic** — red/amber/green map to Critical/Watch/OK throughout the product. Don't repurpose them decoratively.

---

## 7. Layout & responsive

Two-column CSS grid: fixed sign-in rail `clamp(400px, 29%, 452px)`, scrolling content right.

| Breakpoint | Behaviour |
|---|---|
| >1320px | Full layout |
| ≤1320px | Slide art narrows, copy widens |
| ≤1080px | Art fades to 30% and sits behind copy |
| ≤900px | **Single column** — sign-in stacks above content, carousel becomes show/hide, panels go full-width |

⚠️ **Fragile:** several vertical offsets are hardcoded to the header stack height (`.mission{top:82px}`, `.copy{padding-top:236px}`). If the mission statement wraps to two lines these drift out of alignment. Convert to a CSS variable if you edit the header.

---

## 8. Accessibility — current state

Done: semantic landmarks, `aria-modal` and `aria-hidden` on panels, Esc to close, visible `:focus-visible` rings, `prefers-reduced-motion` honoured, buttons are real buttons.

**Not done — needs work:**
- **No focus trap in panels.** Tab escapes to the page behind. Add a trap.
- No skip-to-content link.
- Carousel has no pause control for keyboard-only users (hover-pause is mouse-only).
- Decorative SVGs are `aria-hidden` but the illustrations carry meaning — consider text alternatives.
- Colour contrast unverified against WCAG AA. Check `--slate` on `--bg` and mono labels at 9.5px.

---

## 9. Browser support

Uses `backdrop-filter`, CSS `clamp()`, `:focus-visible`, `Element.closest()`, WebP. Fine in current Chrome/Edge/Firefox/Safari. **No IE11 support and no polyfills.** WebP needs a fallback only if you must support pre-2020 Safari.

---

## 10. Suggested first PR

1. Extract inlined images to `/assets/`, reference by URL
2. Wire both forms to real endpoints + real confirmation states
3. Wire sign-in to auth, add error handling
4. Fix the 18 placeholder CTA links
5. Add favicon, OG tags, analytics
6. Wrap JS in `DOMContentLoaded`
7. Add focus trap to panels

Items 2 and 3 are the only true blockers.
