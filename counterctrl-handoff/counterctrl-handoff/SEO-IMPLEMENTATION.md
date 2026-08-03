# SEO Implementation — CounterCtrl Cloud

## The one-sentence version

The site is a single login page. Google reads it as a login page, because that is what the
`<title>` and the only `<h1>` say. Nothing else can rank until the marketing content has its own
URLs — and the 17 Field Notes posts, which are the best on-topic content DCR owns, are invisible
to crawlers because they live in a JavaScript array that only renders on click.

## Audit of the current file

| Signal | State |
|---|---|
| `<title>` | "CounterCtrl Cloud — Sign in" — targets no commercial query |
| `<h1>` | "Sign in to your account" — the only h1 on the site |
| Indexable long-form content | **None.** 17 posts (~35 KB) sit in `var POSTS=` and enter the DOM only on click |
| Internal links | **One** (`blog/index.html`, relative, target may not exist) |
| Structured data | None |
| `sitemap.xml` / `robots.txt` | Neither exists |
| `og:image` | Placeholder (`/og-counterctrl.png`, not created) |
| Canonical | `https://counterctrl.cloud/` — **assumed, needs confirming** |
| Images | 4 `<img>`, 2 with empty `alt`; the 11 illustrations are inline SVG marked `aria-hidden` (correct for a11y, invisible to search) |
| Crawlable copy that does exist | The About panel — its 7 `<h3>`s are static HTML |

## Which target terms are worth chasing

Of the five themes discussed, three are worth building pages for and two are not.

**Worth it**
- grocery analytics software / supermarket sales reporting
- grocery loss prevention analytics / exception reporting
- multi-store retail reporting, store manager mobile reporting

**Not worth it as lead-gen**
- **"cloud services"** — you are competing with AWS and Azure. No commercial intent for you.
- **"data warehouse pipeline"** — attracts data engineers evaluating architecture, not grocers
  buying software. Build the page for credibility (prospects' IT teams will read it) but do not
  expect leads from it.
- **"mobile application" / "digital reporting"** alone are too generic. Qualify them:
  "store manager reporting app", "grocery digital reporting".

Long-tail is where this wins. You will not outrank Nielsen for "retail analytics". You can
absolutely rank for "grocery loss prevention analytics for independent operators",
"DSD receiving report software", "item movement report supermarket".

## Page map

See `seo/page-map.csv` for the full table with title tags and meta descriptions.

| URL | Primary query | Notes |
|---|---|---|
| `/` | CounterCtrl Cloud (brand) | Marketing home — **not** the login |
| `/login` | — | Current page, `noindex` |
| `/grocery-analytics` | grocery analytics software | Money page |
| `/loss-prevention` | grocery loss prevention analytics | Money page |
| `/mobile` | store manager reporting app | Ties to the existing mobile work |
| `/platform` | retail data warehouse pipeline | Credibility, not leads |
| `/who-its-for/{role}` | e.g. pricing coordinator reporting | Optional; the ten roles are already written |
| `/blog/` + `/blog/{slug}/` | long-tail, 17 posts | **Highest value item on this list** |
| `/walkthrough`, `/support` | — | Conversion pages |

## Order of work

1. **Ship the blog with real URLs.** `scripts/build-blog.mjs` does this from `posts.json`
   (see `README.md`). Biggest single win: 17 on-topic pages where there are currently zero.
2. **Split the marketing surface off the login page.** `/` becomes the marketing home,
   `/login` gets `<meta name="robots" content="noindex,follow">`. This is the same split that
   fixes the mobile ordering problem and the 574 KB page weight — one decision, three payoffs.
3. **Internal linking.** Posts → product pages, product pages → relevant posts, everything → `/`.
   Right now there is essentially no link graph at all.
4. **JSON-LD.** Templates in `seo/`. Organization on every page, SoftwareApplication on `/`,
   BlogPosting per post (the build script emits these), FAQPage on `/grocery-analytics`.
5. **`sitemap.xml` + `robots.txt`** (script emits both), then verify in Google Search Console
   and Bing Webmaster Tools.
6. **Alt text.** The post images are the real opportunity — the script uses the post title as
   alt, which is a reasonable default but worth hand-writing for the 13 that have images.
7. **`og:image`** — create a real 1200×630, replace the placeholder.

## Claims that need verifying before they go public

These now appear in metadata and structured data, where competitors check them:

- **"65 years"** of POS sales and support → `foundingDate` in the Organization JSON-LD is filled
  in as **1961**, derived arithmetically. Confirm the real year.
- **"Hundreds of locations"** — confirm the figure is defensible and currently true.
- **"Single stores to corporate banners"** — confirm both extremes are live customers.
- **The domain** `counterctrl.cloud` is an assumption. Every canonical, sitemap entry and OG URL
  depends on it. Re-run the build script with `--base` once confirmed.

## What not to do

Do not spin up six thin pages to cover six keywords. Two genuinely good pages plus a real blog
will outperform that, and the Field Notes archive is already better writing than most competitors
in this space are publishing. It just needs to be reachable.
