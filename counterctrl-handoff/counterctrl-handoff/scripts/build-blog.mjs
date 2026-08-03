#!/usr/bin/env node
/**
 * build-blog.mjs — turns posts.json into crawlable, server-rendered blog pages.
 *
 * WHY THIS EXISTS
 * The 17 Field Notes posts currently live inside a JavaScript array in index.html and only
 * enter the DOM when someone clicks "Field Notes". Crawlers never execute that click, so
 * roughly 35 KB of on-topic long-form content is invisible to search. This script gives each
 * post a real URL with real HTML in the initial response.
 *
 * USAGE
 *   node scripts/build-blog.mjs --base https://counterctrl.cloud --out ./build
 *
 * OUTPUT
 *   build/blog/index.html                 archive page
 *   build/blog/{slug}/index.html          one page per post
 *   build/sitemap.xml                     every URL, with lastmod
 *   build/robots.txt
 *
 * This is a starting point, not a finished site. It emits semantic HTML with correct metadata
 * and JSON-LD; drop your own stylesheet in via --css or wire the output into whatever framework
 * you actually use. The parts that matter for SEO are the URL structure, the <head> block,
 * the JSON-LD, and the internal links — all of which are here.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, cur, i, arr) => {
    if (cur.startsWith('--')) acc.push([cur.slice(2), arr[i + 1]?.startsWith('--') ? true : arr[i + 1]]);
    return acc;
  }, [])
);

const BASE = (args.base || 'https://counterctrl.cloud').replace(/\/$/, '');
const OUT = args.out || './build';
const CSS = args.css || '/assets/blog.css';
const ORG = 'DCR POS';

const esc = (s) =>
  String(s).replace(/&(?![a-z]+;|#\d+;)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// posts.json titles already contain a few HTML entities (&amp;) — strip tags for metadata use
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&[a-z]+;/gi, ' ').trim();

const iso = (slug) => (slug.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || new Date().toISOString().slice(0, 10);

const write = async (path, body) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, 'utf8');
};

/** Per-page <head>. Every field here matters; none of it is decorative. */
function head({ title, description, canonical, image, type = 'article', published, jsonld }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="CounterCtrl Cloud">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
${image ? `<meta property="og:image" content="${esc(BASE + image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
${published ? `<meta property="article:published_time" content="${published}">` : ''}
<link rel="stylesheet" href="${esc(CSS)}">
<script type="application/ld+json">
${JSON.stringify(jsonld, null, 2)}
</script>
</head>
<body>`;
}

const nav = `
<header class="site-hd">
  <a class="site-logo" href="/">CounterCtrl Cloud</a>
  <nav aria-label="Main">
    <a href="/grocery-analytics">Grocery analytics</a>
    <a href="/loss-prevention">Loss prevention</a>
    <a href="/mobile">Mobile</a>
    <a href="/platform">Platform</a>
    <a href="/blog">Field Notes</a>
    <a class="cta" href="/walkthrough">Book a walkthrough</a>
  </nav>
</header>`;

const foot = `
<footer class="site-ft">
  <p>&copy; ${new Date().getFullYear()} ${ORG} — a Data Enterprises company. Point of sale sales and support since 1961.
     <!-- VERIFY: "since 1961" is derived from the "65 years" claim. Confirm the real founding year
          before publishing — it appears in JSON-LD as foundingDate and is easily checked. --></p>
  <p><a href="/login">Sign in</a> · <a href="/support">Support</a> · <a href="/sitemap.xml">Sitemap</a></p>
</footer>
</body>
</html>`;

async function main() {
  const posts = JSON.parse(await readFile(args.posts || './posts.json', 'utf8'));
  const urls = [];

  // ---- individual posts -------------------------------------------------
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const slug = p.s;
    const url = `${BASE}/blog/${slug}/`;
    const published = iso(slug);
    const title = plain(p.t);
    const desc = plain(p.k).slice(0, 155);

    // newer/older links — internal linking is one of the biggest gaps in the current site
    const newer = posts[i - 1];
    const older = posts[i + 1];

    const jsonld = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: desc,
      datePublished: published,
      dateModified: published,
      author: { '@type': 'Person', name: p.a || 'CounterCtrl Cloud' },
      publisher: {
        '@type': 'Organization',
        name: ORG,
        url: BASE,
        logo: { '@type': 'ImageObject', url: `${BASE}/assets/logo.png` }
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      articleSection: plain(p.c),
      ...(p.im ? { image: BASE + p.im } : {})
    };

    const body = `
${nav}
<main>
<article class="post">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="/">Home</a> › <a href="/blog">Field Notes</a> › <span>${esc(plain(p.c))}</span>
  </nav>
  <p class="post-meta">
    <span class="post-cat">${esc(plain(p.c))}</span>
    <time datetime="${published}">${esc(p.d)}</time>
    <span class="post-author">${esc(p.a || '')}</span>
  </p>
  <h1>${esc(title)}</h1>
  <p class="post-dek">${esc(plain(p.k))}</p>
  ${p.im ? `<img class="post-img" src="${esc(p.im)}" alt="${esc(title)}" width="1200" height="630" loading="lazy">` : ''}
  <div class="post-body">
${p.b.map((x) => `    <p>${esc(plain(x))}</p>`).join('\n')}
  </div>
  <nav class="post-nav" aria-label="More posts">
    ${newer ? `<a class="np" href="/blog/${newer.s}/"><span>Newer</span>${esc(plain(newer.t))}</a>` : ''}
    ${older ? `<a class="np" href="/blog/${older.s}/"><span>Older</span>${esc(plain(older.t))}</a>` : ''}
  </nav>
  <aside class="post-cta-box">
    <h2>See it on your own numbers</h2>
    <p>CounterCtrl Cloud reads your overnight sales and hands your team the short list worth looking at.</p>
    <a class="cta" href="/walkthrough">Book a walkthrough</a>
  </aside>
</article>
</main>
${foot}`;

    await write(join(OUT, 'blog', slug, 'index.html'),
      head({ title: `${title} — CounterCtrl Cloud`, description: desc, canonical: url,
             image: p.im, published, jsonld }) + body);

    urls.push({ loc: url, lastmod: published, priority: '0.6' });
  }

  // ---- archive ----------------------------------------------------------
  const archiveUrl = `${BASE}/blog/`;
  const cats = [...new Set(posts.map((p) => plain(p.c)))];
  const archive = `
${nav}
<main>
<h1>Field Notes</h1>
<p class="lede">Writing on grocery and retail data analytics, loss prevention, store reporting and the
   day-to-day of running numbers across multiple locations — from the team building CounterCtrl Cloud.</p>
<p class="cats">${cats.map((c) => `<span class="chip">${esc(c)}</span>`).join(' ')}</p>
<ul class="post-list">
${posts.map((p) => `  <li>
    <a href="/blog/${p.s}/">
      ${p.im ? `<img src="${esc(p.im)}" alt="" width="320" height="180" loading="lazy">` : ''}
      <span class="pl-meta"><time datetime="${iso(p.s)}">${esc(p.d)}</time> · ${esc(plain(p.c))}</span>
      <span class="pl-title">${esc(plain(p.t))}</span>
      <span class="pl-dek">${esc(plain(p.k))}</span>
    </a>
  </li>`).join('\n')}
</ul>
</main>
${foot}`;

  await write(join(OUT, 'blog', 'index.html'), head({
    title: 'Field Notes — Grocery & Retail Data Analytics | CounterCtrl Cloud',
    description: 'Practical writing on grocery analytics, loss prevention, multi-store reporting and turning POS data into decisions. From the team at DCR POS.',
    canonical: archiveUrl, type: 'website',
    jsonld: {
      '@context': 'https://schema.org', '@type': 'Blog', name: 'Field Notes',
      url: archiveUrl, publisher: { '@type': 'Organization', name: ORG, url: BASE },
      blogPost: posts.map((p) => ({
        '@type': 'BlogPosting', headline: plain(p.t),
        url: `${BASE}/blog/${p.s}/`, datePublished: iso(p.s)
      }))
    }
  }) + archive);

  urls.unshift({ loc: archiveUrl, lastmod: iso(posts[0].s), priority: '0.8' });

  // ---- marketing pages (stubs the dev fills in; URLs reserved in the sitemap) ----
  for (const page of ['', 'grocery-analytics', 'loss-prevention', 'mobile', 'platform', 'walkthrough']) {
    urls.unshift({ loc: `${BASE}/${page}`, lastmod: new Date().toISOString().slice(0, 10),
                   priority: page === '' ? '1.0' : '0.9' });
  }

  // ---- sitemap + robots -------------------------------------------------
  await write(join(OUT, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`);

  await write(join(OUT, 'robots.txt'),
`User-agent: *
Allow: /

# the login page has no search value and shouldn't compete with the marketing home
Disallow: /login
Disallow: /api/

Sitemap: ${BASE}/sitemap.xml
`);

  console.log(`Wrote ${posts.length} post pages + archive + sitemap (${urls.length} URLs) to ${OUT}`);
  console.log(`Base URL: ${BASE}  — re-run with --base once the real domain is confirmed.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
