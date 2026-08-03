#!/usr/bin/env node
/**
 * build-static-pages.mjs — the crawlable half of the portal.
 *
 * WHY THIS EXISTS
 * The React app shows Field Notes, About and Book a walkthrough as slide-over
 * panels on the login page. That is one URL. A search result is a link to a
 * page, so one URL can only ever produce one result — no amount of fetching or
 * rendering changes that. This writes the same content as separate pages with
 * separate addresses, which is the only thing that can rank.
 *
 * Sources are shared, so nothing here is a second copy of anything:
 *
 *   posts.json (in S3)     the panel fetches it | this generates 17 pages
 *   aboutContent.ts        the panel renders it | this generates /about.html
 *   walkthroughContent.ts  the panel renders it | this generates /walkthrough.html
 *
 * Posts are fetched from the bucket, not read from disk, because that is where
 * they are published. Building from the bundled copy would silently omit
 * anything uploaded since the last deploy.
 *
 * OUTPUT goes to public/, which Vite copies into dist/ verbatim — so the
 * existing `npm run publish` ships these pages to www.counterctrlcloud.com
 * behind the existing CloudFront. No second bucket, no new origin.
 *
 * Everything it writes is generated. Re-run it rather than hand-editing.
 *
 * USAGE
 *   node scripts/build-static-pages.mjs
 *   node scripts/build-static-pages.mjs --base https://staging.example.com
 */

import { readFile, writeFile, mkdir, copyFile, readdir, rm } from "node:fs/promises";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { build as esbuild } from "esbuild";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/* ---- configuration --------------------------------------------------- */

/** Flat .html files, not folders with index.html inside.
 *
 *  A folder URL (/about/) makes CloudFront ask S3 for the key "about/", which
 *  does not exist, so it falls through to the SPA and renders a blank React
 *  route. Serving folder URLs needs a CloudFront Function to append
 *  index.html. Flat files need no configuration at all and Google treats the
 *  two identically. */
const BLOG_DIR = "field-notes";
const ARCHIVE = "field-notes.html";
const ABOUT = "about.html";
const WALKTHROUGH = "walkthrough.html";
const TERMS = "terms.html";
const PRIVACY = "privacy-policy.html";

/** Images for these pages are copied unhashed. Kept out of /assets/ so they
 *  can't be confused with Vite's fingerprinted build output. */
const ASSET_DIR = "portal-assets";
const ASSET_BASE = `/${ASSET_DIR}/`;

const ORG = "DCR POS";
const SITE = "CounterCtrl Cloud";

/* ---- args ------------------------------------------------------------ */

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (!a.startsWith("--")) continue;
  const next = process.argv[i + 1];
  args[a.slice(2)] = !next || next.startsWith("--") ? true : next;
}

const BASE = String(args.base || "https://www.counterctrlcloud.com").replace(/\/$/, "");
const API = String(args.api || "https://dev-api.counterctrlcloud.com/").replace(/\/?$/, "/");
const OUT = String(args.out || join(ROOT, "public"));

/* ---- helpers --------------------------------------------------------- */

const esc = (s) =>
  String(s)
    .replace(/&(?![a-z]+;|#\d+;)/gi, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Decode the handful of entities the authored copy carries, so "Orders &amp;
 *  Coupons" doesn't render literally. Runs before esc() re-encodes properly. */
const decode = (s) =>
  String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

/** Strip markup and entities, for metadata that can't contain either. */
const plain = (s) => decode(String(s).replace(/<[^>]+>/g, "")).trim();

/** Publish date lives in the slug's YYYY-MM-DD prefix. */
const iso = (slug) =>
  (slug.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] ||
  new Date().toISOString().slice(0, 10);

/** "prohibited_actions" → "Prohibited actions". Both legal documents group
 *  lists under descriptive keys but supply no lead-in sentence, so a bare list
 *  reads as orphaned. Title-casing the key names it without inventing legal
 *  wording. Mirrors shared/legalText.ts on the app side. */
const listLabel = (k) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

/** A run of prose written entirely in capitals — the convention both documents
 *  use for the clauses they most want read. */
const isShouted = (t) => {
  const letters = String(t).replace(/[^A-Za-z]/g, "");
  return letters.length > 24 && letters === letters.toUpperCase();
};

const write = async (path, body) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, "utf8");
};

const urls = [];
const track = (loc, lastmod, priority) => urls.push({ loc, lastmod, priority });

const today = new Date().toISOString().slice(0, 10);

/* ---- content loading ------------------------------------------------- */

/** Fetch posts.json exactly the way the app does — list the bucket, find the
 *  file, fetch its public URL. Two hops, but it guarantees the pages and the
 *  running panel can never disagree about which copy is current. */
async function fetchPosts() {
  if (args.posts && args.posts !== true) {
    console.log(`Reading ${args.posts} (--posts given, skipping fetch)`);
    return JSON.parse(await readFile(args.posts, "utf8"));
  }

  const listUrl = `${API}html_pages/get_pages`;
  console.log(`Listing bucket   ${listUrl}`);
  const listing = await fetch(listUrl);
  if (!listing.ok) throw new Error(`${listUrl} returned ${listing.status}`);

  const { files = [] } = await listing.json();
  const file = files.find((f) => f.filename === "posts.json");
  if (!file) {
    throw new Error(
      `No posts.json in the listing (${files.length} file(s)). Upload it, or ` +
        `pass --posts to build from a local copy.`,
    );
  }

  console.log(`Fetching posts   ${file.url}`);
  const res = await fetch(file.url);
  if (!res.ok) throw new Error(`${file.url} returned ${res.status}`);
  return res.json();
}

/** Import the app's own TypeScript content modules, so these pages and the
 *  panels genuinely share one source. Node can't read TS or .webp, so esbuild
 *  bundles first and a plugin rewrites image imports to served paths. */
async function loadPortalContent() {
  const assetPaths = {
    name: "asset-paths",
    setup(b) {
      b.onResolve({ filter: /\.(webp|png|jpe?g|svg)$/ }, (a) => ({
        path: a.path,
        namespace: "asset",
      }));
      b.onLoad({ filter: /.*/, namespace: "asset" }, (a) => ({
        contents: `export default ${JSON.stringify(ASSET_BASE + basename(a.path))}`,
        loader: "js",
      }));
    },
  };

  const p = (rel) => JSON.stringify(join(ROOT, rel).replace(/\\/g, "/"));
  const entry = join(tmpdir(), `portal-content-${process.pid}.ts`);
  const outfile = join(tmpdir(), `portal-content-${process.pid}.mjs`);

  await writeFile(
    entry,
    `export * from ${p("src/pages/home/portal/about/aboutContent.ts")};\n` +
      `export * from ${p("src/pages/home/portal/walkthrough/walkthroughContent.ts")};\n`,
    "utf8",
  );

  try {
    await esbuild({
      entryPoints: [entry],
      outfile,
      bundle: true,
      format: "esm",
      platform: "neutral",
      plugins: [assetPaths],
      logLevel: "silent",
    });
    return await import(`file://${outfile.replace(/\\/g, "/")}`);
  } finally {
    await rm(entry, { force: true });
    await rm(outfile, { force: true });
  }
}

/** Copy the unhashed images these pages reference. */
async function copyAssets() {
  const dest = join(OUT, ASSET_DIR);
  await mkdir(dest, { recursive: true });

  const heroDir = join(ROOT, "src/assets/portal/blog");
  const heroes = (await readdir(heroDir)).filter((f) => /\.webp$/i.test(f));
  for (const f of heroes) await copyFile(join(heroDir, f), join(dest, f));

  const extra = ["integrated-pos.webp", "logo.webp"];
  for (const f of extra) {
    try {
      await copyFile(join(ROOT, "src/assets/portal", f), join(dest, f));
    } catch {
      /* logo.webp may not exist under that name; only used in JSON-LD */
    }
  }
  return heroes.length;
}

/* ---- shared chrome --------------------------------------------------- */

function head({ title, description, canonical, image, type = "website", published, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<link rel="icon" href="/favicon.ico">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="${SITE}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(image.startsWith("http") ? image : BASE + image)}">` : ""}
<meta name="twitter:card" content="summary_large_image">
${published ? `<meta property="article:published_time" content="${published}">` : ""}
<link rel="stylesheet" href="/${ASSET_DIR}/portal.css">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>
<body>`;
}

const nav = `
<header class="site-hd">
  <a class="site-logo" href="/">${SITE}</a>
  <nav aria-label="Main">
    <a href="/${ARCHIVE}">Field Notes</a>
    <a href="/${ABOUT}">About</a>
    <a href="/">Sign in</a>
    <a class="cta" href="/${WALKTHROUGH}">Book a walkthrough</a>
  </nav>
</header>`;

const foot = `
<footer class="site-ft">
  <p>&copy; ${new Date().getFullYear()} ${ORG} — a Data Enterprises company.
     <!-- VERIFY before this ranks for anything: SEO-IMPLEMENTATION.md flags
          "65 years" / founding year 1961, "hundreds of locations", and the
          single-store-to-corporate-banner range as unconfirmed. --></p>
  <p><a href="/">Sign in</a> · <a href="/${ARCHIVE}">Field Notes</a> · <a href="/sitemap.xml">Sitemap</a></p>
</footer>
</body>
</html>`;

const orgJsonLd = {
  "@type": "Organization",
  name: ORG,
  url: BASE,
};

const ctaBox = `
  <aside class="cta-box">
    <h2>See it on your own numbers</h2>
    <p>${SITE} reads your overnight sales and hands your team the short list worth looking at.</p>
    <a class="cta" href="/${WALKTHROUGH}">Book a walkthrough</a>
  </aside>`;

/* ---- blog ------------------------------------------------------------ */

async function buildBlog(posts) {
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const url = `${BASE}/${BLOG_DIR}/${p.s}.html`;
    const published = iso(p.s);
    const title = plain(p.t);
    const desc = plain(p.k).slice(0, 155);
    const newer = posts[i - 1];
    const older = posts[i + 1];
    const hero = p.im ? ASSET_BASE + basename(p.im) : null;

    const body = `
${nav}
<main>
<article class="post">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> › <a href="/${ARCHIVE}">Field Notes</a> › <span>${esc(plain(p.c))}</span>
  </nav>
  <p class="post-meta">
    <span>${esc(plain(p.c))}</span>
    <time datetime="${published}">${esc(p.d)}</time>
    <span>${esc(plain(p.a || ""))}</span>
  </p>
  <h1>${esc(title)}</h1>
  <p class="post-dek">${esc(plain(p.k))}</p>
  ${hero ? `<img class="post-img" src="${esc(hero)}" alt="${esc(title)}" width="1200" height="630" loading="lazy">` : ""}
  <div class="post-body">
${p.b.map((x) => `    <p>${esc(plain(x))}</p>`).join("\n")}
  </div>
  <nav class="post-nav" aria-label="More posts">
    ${newer ? `<a class="np" href="/${BLOG_DIR}/${newer.s}.html"><span>Newer</span>${esc(plain(newer.t))}</a>` : ""}
    ${older ? `<a class="np" href="/${BLOG_DIR}/${older.s}.html"><span>Older</span>${esc(plain(older.t))}</a>` : ""}
  </nav>
${ctaBox}
</article>
</main>
${foot}`;

    await write(
      join(OUT, BLOG_DIR, `${p.s}.html`),
      head({
        title: `${title} — ${SITE}`,
        description: desc,
        canonical: url,
        image: hero,
        type: "article",
        published,
        jsonld: {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description: desc,
          datePublished: published,
          dateModified: published,
          author: { "@type": "Person", name: plain(p.a || SITE) },
          publisher: orgJsonLd,
          mainEntityOfPage: { "@type": "WebPage", "@id": url },
          articleSection: plain(p.c),
          ...(hero ? { image: BASE + hero } : {}),
        },
      }) + body,
    );

    track(url, published, "0.6");
  }

  const archiveUrl = `${BASE}/${ARCHIVE}`;
  const cats = [...new Set(posts.map((p) => plain(p.c)))];

  const archive = `
${nav}
<main>
<h1>Field Notes</h1>
<p class="lede">Writing on grocery and retail data analytics, loss prevention, store reporting and the
   day-to-day of running numbers across multiple locations — from the team building ${SITE}.</p>
<p class="cats">${cats.map((c) => `<span class="chip">${esc(c)}</span>`).join(" ")}</p>
<ul class="post-list">
${posts
  .map((p) => {
    const hero = p.im ? ASSET_BASE + basename(p.im) : null;
    // The three text spans are wrapped so the row is exactly two grid
    // children — otherwise the title lands back in the image column.
    return `  <li>
    <a href="/${BLOG_DIR}/${p.s}.html">
      ${hero ? `<img src="${esc(hero)}" alt="" width="320" height="180" loading="lazy">` : ""}
      <span class="pl-body">
        <span class="pl-meta"><time datetime="${iso(p.s)}">${esc(p.d)}</time> · ${esc(plain(p.c))}</span>
        <span class="pl-title">${esc(plain(p.t))}</span>
        <span class="pl-dek">${esc(plain(p.k))}</span>
      </span>
    </a>
  </li>`;
  })
  .join("\n")}
</ul>
${ctaBox}
</main>
${foot}`;

  await write(
    join(OUT, ARCHIVE),
    head({
      title: `Field Notes — Grocery & Retail Data Analytics | ${SITE}`,
      description:
        "Practical writing on grocery analytics, loss prevention, multi-store reporting and turning POS data into decisions. From the team at DCR POS.",
      canonical: archiveUrl,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Field Notes",
        url: archiveUrl,
        publisher: orgJsonLd,
        blogPost: posts.map((p) => ({
          "@type": "BlogPosting",
          headline: plain(p.t),
          url: `${BASE}/${BLOG_DIR}/${p.s}.html`,
          datePublished: iso(p.s),
        })),
      },
    }) + archive,
  );

  track(archiveUrl, iso(posts[0].s), "0.8");
}

/* ---- about ----------------------------------------------------------- */

async function buildAbout(c) {
  const url = `${BASE}/${ABOUT}`;
  const m = c.ABOUT_MISSION;
  const mission = `${m.lead}${m.emphasis}${m.tail}`;

  const section = (s) => {
    const list = !s.items?.length
      ? ""
      : s.listKind === "numbered"
        ? `<ol class="about-steps">
${s.items.map((it) => `      <li${it.key ? ' class="key"' : ""}><strong>${esc(plain(it.term))}</strong> <span>${esc(plain(it.desc))}</span></li>`).join("\n")}
    </ol>`
        : `<dl class="about-defs">
${s.items.map((it) => `      <dt${it.key ? ' class="key"' : ""}>${esc(plain(it.term))}</dt>\n      <dd>${esc(plain(it.desc))}</dd>`).join("\n")}
    </dl>`;

    return `  <section id="${esc(s.id)}" class="about-sec">
    <p class="kicker">${esc(plain(s.kicker))}</p>
    <h2>${esc(plain(s.heading))}</h2>
${s.paras.map((p) => `    <p>${esc(plain(p))}</p>`).join("\n")}
    ${s.image ? `<img class="about-img" src="${esc(s.image.src)}" alt="${esc(plain(s.image.alt))}" loading="lazy">` : ""}
    ${list}
  </section>`;
  };

  const body = `
${nav}
<main>
<article class="about">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>About</span></nav>
  <p class="kicker">${esc(plain(m.kicker))}</p>
  <h1>About ${SITE}</h1>
  <p class="lede">${esc(plain(mission))}</p>
${c.ABOUT_SECTIONS.map(section).join("\n")}
  <dl class="about-facts">
${c.ABOUT_FACTS.map((f) => `    <dt>${esc(plain(f.k))}</dt>\n    <dd>${esc(plain(f.v))}</dd>`).join("\n")}
  </dl>
${ctaBox}
</article>
</main>
${foot}`;

  await write(
    join(OUT, ABOUT),
    head({
      title: `About ${SITE} — Built by ${ORG}`,
      description: plain(mission).slice(0, 155),
      canonical: url,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "AboutPage",
        name: `About ${SITE}`,
        url,
        mainEntity: orgJsonLd,
      },
    }) + body,
  );

  track(url, today, "0.8");
}

/* ---- walkthrough ----------------------------------------------------- */

async function buildWalkthrough(c) {
  const url = `${BASE}/${WALKTHROUGH}`;
  const copy = c.WALKTHROUGH_COPY;

  const field = (f) => {
    const req = f.required ? " required" : "";
    const label = `<label for="${esc(f.id)}">${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ""}</label>`;
    let control;
    if (f.kind === "select") {
      // Option 0 is the inert prompt and carries an empty value, so an
      // untouched select submits nothing — matching PortalForm.
      control = `<select id="${esc(f.id)}" name="${esc(f.id)}"${req}>
${f.options.map((o, i) => `        <option value="${i === 0 ? "" : esc(o)}">${esc(o)}</option>`).join("\n")}
      </select>`;
    } else if (f.kind === "textarea") {
      control = `<textarea id="${esc(f.id)}" name="${esc(f.id)}" rows="4" placeholder="${esc(f.placeholder || "")}"${req}></textarea>`;
    } else {
      control = `<input id="${esc(f.id)}" name="${esc(f.id)}" type="${esc(f.kind)}" placeholder="${esc(f.placeholder || "")}"${req}>`;
    }
    return `    <div class="field${f.wide ? " wide" : ""}">
      ${label}
      ${control}
    </div>`;
  };

  // The endpoint takes JSON, so the form is serialized rather than natively
  // submitted. <noscript> covers the case where that can't run.
  const script = `
<script>
(function () {
  var f = document.getElementById('wt'), msg = document.getElementById('wtMsg');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = {};
    new FormData(f).forEach(function (v, k) { if (String(v).trim()) data[k] = v; });
    msg.textContent = 'Sending…'; msg.className = 'form-msg';
    fetch(${JSON.stringify(API + "contact/walkthrough")}, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      f.hidden = true;
      msg.textContent = ${JSON.stringify(copy.confirmation)};
      msg.className = 'form-msg ok';
    }).catch(function () {
      msg.textContent = "That didn't send — something went wrong on our end. Try again, or email us directly.";
      msg.className = 'form-msg err';
    });
  });
})();
</script>`;

  const body = `
${nav}
<main>
<article class="walkthrough">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>Book a walkthrough</span></nav>
  <p class="kicker">${esc(plain(copy.kicker))}</p>
  <h1>${esc(plain(copy.title))}</h1>
  <p class="lede">${esc(plain(copy.intro))}</p>
  <noscript><p class="form-msg err">This form needs JavaScript to send. Email us instead and we'll get straight back to you.</p></noscript>
  <form id="wt" class="wt-form">
${c.WALKTHROUGH_FIELDS.map(field).join("\n")}
    <button type="submit">${esc(plain(copy.submit))}</button>
  </form>
  <p id="wtMsg" class="form-msg" role="status"></p>
</article>
</main>
${foot}
${script}`;

  await write(
    join(OUT, WALKTHROUGH),
    head({
      title: `Book a walkthrough — ${SITE}`,
      description: plain(copy.intro).slice(0, 155),
      canonical: url,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "ContactPage",
        name: plain(copy.title),
        url,
        mainEntity: orgJsonLd,
      },
    }) + body,
  );

  track(url, today, "0.9");
}

/* ---- legal pages ----------------------------------------------------- */

/** Shared renderers for the two legal documents. Both arrive as JSON with
 *  unlabelled lists and all-caps clauses, and both are rendered verbatim —
 *  the only text added is a heading per list, derived from its own key. */
const notice = (t) => `  <p class="notice">${esc(plain(t))}</p>`;

const bullets = (label, items, muted) =>
  `  <div class="l-list${muted ? " muted" : ""}">
${label ? `    <p class="kicker">${esc(label)}</p>` : ""}
    <ul>
${items.map((i) => `      <li>${esc(plain(i))}</li>`).join("\n")}
    </ul>
  </div>`;

const legalPara = (t) =>
  isShouted(t) ? notice(t) : `  <p>${esc(plain(t))}</p>`;

async function buildTerms() {
  const doc = JSON.parse(
    await readFile(join(ROOT, "src/content/terms.json"), "utf8"),
  );
  const url = `${BASE}/${TERMS}`;
  const STRUCTURAL = new Set([
    "number", "title", "paragraphs", "uppercase_notice", "subsections", "contact",
  ]);

  const section = (sec) => {
    const lists = Object.keys(sec).filter(
      (k) => !STRUCTURAL.has(k) && Array.isArray(sec[k]),
    );
    const c = sec.contact;
    return `<section class="l-sec">
  <h2><span class="num">${sec.number}.</span> ${esc(plain(sec.title))}</h2>
${sec.uppercase_notice ? notice(sec.uppercase_notice) : ""}
${(sec.paragraphs || []).map(legalPara).join("\n")}
${lists.map((k) => bullets(listLabel(k), sec[k], false)).join("\n")}
${
  sec.subsections
    ? `  <dl class="l-subs">
${sec.subsections.map((x) => `    <dt><span class="num">(${esc(x.id)})</span> ${esc(plain(x.title))}</dt>\n    <dd>${esc(plain(x.text))}</dd>`).join("\n")}
  </dl>`
    : ""
}
${
  c
    ? `  <address class="l-contact">
    <strong>${esc(c.legal_name)}</strong><br>${esc(c.brand_name)}<br>
    ${esc(c.street)}<br>${esc(c.city_state_zip)}<br>
    Toll free <a href="tel:${c.toll_free.replace(/[^\d+]/g, "")}">${esc(c.toll_free)}</a><br>
    Local <a href="tel:${c.local.replace(/[^\d+]/g, "")}">${esc(c.local)}</a><br>
    <a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>
    <a href="${esc(c.website)}">${esc(c.website)}</a>
  </address>`
    : ""
}
</section>`;
  };

  const body = `
${nav}
<main class="legal">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>${esc(doc.title)}</span></nav>
  <h1>${esc(doc.title)}</h1>
  <p class="kicker">Last updated ${esc(doc.last_updated)}</p>
${doc.introduction.map(legalPara).join("\n")}
${notice(doc.acceptance_notice)}
  <p>Your use of the Site is also governed by our <a href="/${PRIVACY}">Privacy Policy</a>.</p>
${doc.sections.map(section).join("\n")}
  <p class="l-copy">${esc(plain(doc.copyright))}</p>
</main>
${foot}`;

  await write(
    join(OUT, TERMS),
    head({
      title: `${doc.title} — ${SITE}`,
      description: `${doc.title} governing access to and use of ${SITE}, a product of ${doc.company.legal_name}.`,
      canonical: url,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: doc.title,
        url,
        publisher: orgJsonLd,
        dateModified: doc.last_updated,
      },
    }) + body,
  );

  track(url, doc.last_updated, "0.3");
  return doc.sections.length;
}

async function buildPrivacy() {
  const doc = JSON.parse(
    await readFile(join(ROOT, "src/content/privacy.json"), "utf8"),
  );
  const url = `${BASE}/${PRIVACY}`;
  const STRUCTURAL = new Set(["id", "title", "content", "management", "contact"]);

  /** `collected: false` means the examples beneath are things NOT gathered.
   *  Rendered without that badge the list says the opposite of the document. */
  const block = (b) => {
    const title = b.name ?? b.category ?? "";
    const text = b.description ?? b.reason;
    const items = b.examples ?? b.uses ?? b.information_collected;
    const stated = typeof b.collected === "boolean";
    const no = b.collected === false;
    return `    <div class="l-block">
      <p class="l-block-hd"><strong>${esc(plain(title))}</strong>${stated ? `<span class="badge${no ? " no" : ""}">${no ? "Not collected" : "Collected"}</span>` : ""}</p>
${text ? `      <p>${esc(plain(text))}</p>` : ""}
${items && items.length ? bullets(null, items, no) : ""}
    </div>`;
  };

  const section = (sec) => {
    const extras = Object.keys(sec).filter(
      (k) => !STRUCTURAL.has(k) && Array.isArray(sec[k]) && sec[k].length,
    );
    const c = sec.contact;
    return `<section class="l-sec">
  <h2><span class="num">${sec.id}.</span> ${esc(plain(sec.title))}</h2>
${(sec.content || []).map(legalPara).join("\n")}
${extras
  .map((k) =>
    typeof sec[k][0] === "string"
      ? bullets(listLabel(k), sec[k], false)
      : `  <div class="l-list">
    <p class="kicker">${esc(listLabel(k))}</p>
${sec[k].map(block).join("\n")}
  </div>`,
  )
  .join("\n")}
${sec.management ? `  <p>${esc(plain(sec.management))}</p>` : ""}
${
  c
    ? `  <address class="l-contact">
    <strong>${esc(c.company)}</strong><br>${esc(c.relationship)}<br>
    <a href="mailto:${esc(c.email)}">${esc(c.email)}</a><br>
    <a href="https://${esc(c.website.replace(/^https?:\/\//, ""))}">${esc(c.website)}</a>
  </address>`
    : ""
}
</section>`;
  };

  const body = `
${nav}
<main class="legal">
  <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> › <span>${esc(doc.title)}</span></nav>
  <h1>${esc(doc.title)}</h1>
  <p class="kicker">Last updated ${esc(doc.last_updated)}</p>
${doc.introduction.map(legalPara).join("\n")}
${doc.sections.map(section).join("\n")}
  <p>See also our <a href="/${TERMS}">Terms and Conditions</a>.</p>
</main>
${foot}`;

  await write(
    join(OUT, PRIVACY),
    head({
      title: `${doc.title} — ${SITE}`,
      description: `How ${SITE}, ${doc.company.legal_relationship.toLowerCase()}, collects, uses, stores and shares personal information.`,
      canonical: url,
      jsonld: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: doc.title,
        url,
        publisher: orgJsonLd,
        dateModified: doc.last_updated,
      },
    }) + body,
  );

  track(url, today, "0.3");
  return doc.sections.length;
}

/* ---- stylesheet ------------------------------------------------------ */

/** Generated rather than hand-maintained so the palette can't drift from
 *  src/index.css. Values mirror the --color-brand-* tokens there. */
const CSS = `:root{
  --green:#1E9E52; --green-d:#17803F; --green-t:#EAF7EF;
  --navy:#0F2440; --navy-2:#1B3A63; --slate:#5A6C84;
  --line:#DCE5EF; --line-2:#C8D5E4; --bg:#F4F7FB; --paper:#FAFCFE;
  --danger:#B01639; --danger-bg:#FDF2F5; --danger-line:#F5C2CE;
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--navy);
  font:16px/1.65 Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased}
main{max-width:760px;margin:0 auto;padding:40px 24px 72px}
h1,h2{font-family:"Plus Jakarta Sans",Inter,system-ui,sans-serif;
  letter-spacing:-.022em;line-height:1.22;text-wrap:balance;margin:0 0 14px}
h1{font-size:clamp(28px,4vw,38px);font-weight:800}
h2{font-size:22px;font-weight:700;margin-top:8px}
p{margin:0 0 16px}
a{color:var(--green-d)}
img{max-width:100%;height:auto;border-radius:12px;display:block}

.site-hd{display:flex;align-items:center;justify-content:space-between;gap:24px;
  flex-wrap:wrap;padding:16px 24px;background:var(--paper);border-bottom:1px solid var(--line)}
.site-logo{font-family:"Plus Jakarta Sans",sans-serif;font-weight:800;font-size:16px;
  color:var(--navy);text-decoration:none;letter-spacing:-.02em}
.site-hd nav{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
.site-hd nav a{font-size:14px;color:var(--slate);text-decoration:none}
.site-hd nav a:hover{color:var(--navy)}
.site-hd nav a.cta,.cta{background:var(--navy);color:#fff;text-decoration:none;
  padding:9px 16px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block}
.site-hd nav a.cta:hover,.cta:hover{background:var(--navy-2)}

.kicker,.crumbs,.post-meta,.pl-meta,.chip{font-family:"IBM Plex Mono",ui-monospace,monospace;
  font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--green-d)}
.crumbs{margin-bottom:20px;color:var(--slate)}
.crumbs a{color:var(--slate)}
.kicker{margin:0 0 8px}
.lede{font-size:18px;line-height:1.6;color:var(--slate);margin-bottom:32px}

.post-meta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px}
.post-dek{font-size:17px;color:var(--slate);margin-bottom:24px}
.post-img{margin:0 0 28px;border:1px solid var(--line)}
.post-body p{font-size:16.5px}
.post-nav{display:grid;gap:10px;margin:40px 0 0;padding-top:24px;border-top:1px solid var(--line)}
.np{display:block;border:1px solid var(--line);border-radius:10px;padding:14px 16px;
  text-decoration:none;color:var(--navy);background:var(--paper)}
.np:hover{border-color:var(--green)}
.np span{display:block;font-family:"IBM Plex Mono",monospace;font-size:10px;
  letter-spacing:.12em;text-transform:uppercase;color:var(--green-d);margin-bottom:4px}

.cats{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.chip{background:var(--green-t);border-radius:999px;padding:5px 11px}
.post-list{list-style:none;margin:0;padding:0}
.post-list li{border-bottom:1px solid var(--line)}
.post-list a{display:grid;grid-template-columns:120px 1fr;gap:16px;align-items:start;
  padding:18px 0;text-decoration:none;color:inherit}
.post-list a:not(:has(img)){grid-template-columns:1fr}
.post-list img{border:1px solid var(--line);border-radius:8px;margin-top:3px}
.pl-body{min-width:0}
.pl-meta{display:block}
.pl-title{font-family:"Plus Jakarta Sans",sans-serif;font-weight:700;font-size:17px;
  display:block;margin:6px 0 4px;letter-spacing:-.02em;color:var(--navy)}
.post-list a:hover .pl-title{color:var(--green-d)}
.pl-dek{font-size:14px;color:var(--slate);display:block}

.about-sec{margin:40px 0;padding-top:32px;border-top:1px solid var(--line)}
.about-img{margin:20px 0;border:1px solid var(--line)}
.about-defs{margin:20px 0 0}
.about-defs dt{font-weight:600;margin-top:14px}
.about-defs dd{margin:2px 0 0;color:var(--slate)}
.about-defs dt.key{color:var(--green-d)}
.about-steps{counter-reset:s;list-style:none;margin:20px 0 0;padding:0}
.about-steps li{counter-increment:s;position:relative;padding:0 0 0 40px;margin-bottom:16px}
.about-steps li::before{content:counter(s,decimal-leading-zero);position:absolute;left:0;top:1px;
  font-family:"IBM Plex Mono",monospace;font-size:12px;color:var(--green-d)}
.about-steps li.key{background:var(--green-t);border-left:3px solid var(--green);
  padding:12px 14px 12px 40px;margin-left:-14px}
.about-steps li.key::before{left:14px;top:13px}
.about-steps strong{display:block}
.about-steps span{color:var(--slate)}
.about-facts{display:grid;grid-template-columns:auto 1fr;gap:6px 20px;margin:36px 0 0;
  padding-top:24px;border-top:1px solid var(--line);font-size:14px}
.about-facts dt{font-family:"IBM Plex Mono",monospace;font-size:11px;letter-spacing:.1em;
  text-transform:uppercase;color:var(--slate)}
.about-facts dd{margin:0}

.wt-form{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin:8px 0 0}
.field{display:flex;flex-direction:column;min-width:0}
.field.wide{grid-column:1/-1}
.field label{font-size:12.5px;font-weight:600;margin-bottom:7px}
.req{color:var(--green-d)}
.wt-form input,.wt-form select,.wt-form textarea{width:100%;padding:10px 12px;
  font:14px/1.5 Inter,system-ui,sans-serif;color:var(--navy);background:#fff;
  border:1px solid var(--line-2);border-radius:8px;outline:none}
.wt-form input:focus,.wt-form select:focus,.wt-form textarea:focus{
  border-color:var(--green);box-shadow:0 0 0 3.5px rgba(30,158,82,.15)}
.wt-form textarea{resize:vertical;line-height:1.6}
.wt-form button{grid-column:1/-1;margin-top:6px;padding:13px 18px;border:0;border-radius:8px;
  background:var(--navy);color:#fff;cursor:pointer;font-family:"Plus Jakarta Sans",sans-serif;
  font-weight:600;font-size:15px}
.wt-form button:hover{background:var(--navy-2)}
.form-msg{margin-top:16px;font-size:14px;color:var(--slate)}
.form-msg.ok{color:var(--green-d)}
.form-msg.err{color:var(--danger);background:var(--danger-bg);border:1px solid var(--danger-line);
  border-radius:8px;padding:10px 14px}

.cta-box{margin:44px 0 0;padding:26px;background:var(--green-t);border:1px solid var(--line);
  border-radius:14px}
.cta-box h2{margin-top:0}

.site-ft{border-top:1px solid var(--line);background:var(--paper);padding:28px 24px;
  font-size:13.5px;color:var(--slate)}
.site-ft p{max-width:760px;margin:0 auto 8px}
.site-ft a{color:var(--slate)}

@media (max-width:620px){
  .wt-form{grid-template-columns:1fr}
  .post-list a{grid-template-columns:1fr}
  main{padding:28px 18px 56px}
}
`;

/* ---- main ------------------------------------------------------------ */

async function main() {
  const posts = await fetchPosts();
  if (!Array.isArray(posts) || !posts.length) {
    throw new Error("posts.json was empty or not an array");
  }

  const content = await loadPortalContent();

  await buildWalkthrough(content);
  await buildAbout(content);
  await buildBlog(posts);

  urls.unshift({ loc: `${BASE}/`, lastmod: today, priority: "1.0" });

  const heroCount = await copyAssets();
  await write(join(OUT, ASSET_DIR, "portal.css"), CSS);

  await write(
    join(OUT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
  );

  // NB: "/" is the React app, which serves the sign-in page when logged out.
  // Not disallowed here — that would deindex the whole origin.
  await write(
    join(OUT, "robots.txt"),
    `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${BASE}/sitemap.xml
`,
  );

  console.log(`
Wrote to public/
  ${posts.length} posts        public/${BLOG_DIR}/*.html
  1 archive          public/${ARCHIVE}
  1 about            public/${ABOUT}
  1 walkthrough      public/${WALKTHROUGH}
  ${heroCount} images + css   public/${ASSET_DIR}/
  sitemap.xml (${urls.length} urls) + robots.txt

  base: ${BASE}

These ship with the app — \`npm run publish\` copies public/ into dist/ and
syncs it. Nothing else to configure.

Re-run this whenever posts.json changes in the bucket, then deploy.
`);
}

main().catch((e) => {
  console.error(`\n${e.message}\n`);
  process.exit(1);
});
