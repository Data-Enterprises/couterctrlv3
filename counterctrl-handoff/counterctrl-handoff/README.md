# CounterCtrl Cloud — Developer Handoff

Two separate bodies of work in here, in priority order:

1. **`DEV-HANDOFF.md`** — production blockers on the existing page (auth wiring, form endpoints,
   page weight). Do these first; the site cannot ship without them.
2. **`SEO-IMPLEMENTATION.md`** — the search work (page map, structured data, blog URLs).

They overlap in one place, which is convenient: moving the Field Notes posts out of `index.html`
is both the biggest performance fix *and* the biggest SEO fix. Do it once, collect both.

---

## What's in the box

```
index.html              Current approved build. Login + 4-slide carousel + panels.
index-story.html        Storytelling variant — reworked band, sub, slide 4, About panel.
                        Pick one before doing any other work; the SEO copy assumes this one.
posts.json              17 Field Notes posts, extracted from the inline JS array. 36 KB.
assets/                 13 post images, extracted from base64. 224 KB.

scripts/build-blog.mjs  Generates crawlable blog pages + sitemap + robots from posts.json.
build/                  Example output from that script — 18 HTML pages, sitemap, robots.
                        Regenerate rather than editing by hand.

seo/page-map.csv        Every planned URL with target query, title tag, meta description, H1.
seo/head-template.html  The per-page <head> block. Copy and fill the {{TOKENS}}.
seo/jsonld-*.json       Organization, SoftwareApplication, FAQPage templates.

DEV-HANDOFF.md          Production blockers.
SEO-IMPLEMENTATION.md   Full SEO reasoning and audit findings.
```

## Running the blog generator

Node 18+, no dependencies.

```bash
node scripts/build-blog.mjs --base https://YOUR-REAL-DOMAIN --out ./build --posts ./posts.json
```

Emits `build/blog/index.html`, `build/blog/{slug}/index.html` ×17, `build/sitemap.xml`,
`build/robots.txt`. Every post page ships with correct canonical, OG tags, `BlogPosting` JSON-LD,
breadcrumbs and newer/older links.

The markup is semantic but unstyled — it references `/assets/blog.css`, which does not exist yet.
Either write that stylesheet or feed the generator's output structure into whatever framework the
real site uses. The parts that matter for search (URL structure, `<head>`, JSON-LD, internal
links) are done; the visual layer is yours.

## Suggested sequencing

**Week 1 — unblock shipping**
- Wire `POST /api/auth/login` (marked `PROD:` in the script block)
- Wire the walkthrough and support form endpoints — right now both show a success screen and
  send nothing, which is the single highest-risk item in this package
- Swap the inline `POSTS` array for a lazy `fetch('/posts.json')`; pull the five remaining
  data-URI images out to files. 574 KB → ~60 KB.

**Week 2 — split the surface**
- `/` becomes the marketing home; the current page moves to `/login` with `noindex,follow`
- This also fixes the mobile reading order and lets the login page load fast
- Stand up `/grocery-analytics` and `/loss-prevention` from `seo/page-map.csv`

**Week 3 — search**
- Run the blog generator against the real domain, deploy `/blog/`
- Add JSON-LD from `seo/`
- Deploy `sitemap.xml` + `robots.txt`, verify Search Console and Bing Webmaster Tools
- Internal linking pass: posts ↔ product pages

## Before anything goes public

Four factual claims now appear in visible copy and in structured data, where they are easy for a
competitor to check. Confirm each with Tommy or Jason:

- **"65 years"** of POS sales and support (appears as `foundingDate: 1961` in the Organization
  JSON-LD — that year is arithmetic, not a source)
- **"Hundreds of locations"**
- **"Single stores to corporate banners"** — both extremes should be live customers
- **"We don't go live until our numbers match yours"** — describes a validation step; confirm it
  matches actual onboarding practice

Also confirm the domain. `counterctrl.cloud` is an assumption running through every canonical,
sitemap entry and OG URL in this package. One `--base` flag fixes it, but it has to be right
before launch.
