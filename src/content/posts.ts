import raw from "./posts.json";

/** Field Notes articles.
 *
 *  `posts.json` beside this file is a copy of the Aug 2026 handoff's
 *  `posts.json` — the 333 KB inline `POSTS` array pulled out of the document
 *  (DEV-HANDOFF §2), with its images rewritten to real files.
 *
 *  It lives in src/ deliberately. Importing straight from `counterctrl-handoff/`
 *  would make the app's build depend on a delivery folder that can be deleted
 *  once the port is done. To take new content, overwrite this copy.
 *
 *  The wire format uses single-letter keys — that array was authored to be
 *  small, not readable. They are expanded once here so no component ever has
 *  to know that `k` is the dek.
 */

interface RawPost {
  /** slug */ s: string;
  /** date_display */ d: string;
  /** category */ c: string;
  /** author */ a: string;
  /** title */ t: string;
  /** dek */ k: string;
  /** body paragraphs */ b: string[];
  /** hero image, as a served path like /assets/post-{slug}.webp */ im?: string;
}

export interface Post {
  slug: string;
  title: string;
  dek: string;
  category: string;
  author: string;
  /** Preformatted for display. Parse to a real timestamp on CMS import. */
  date: string;
  /** Resolved to a hashed asset URL, or null for the 4 posts without art. */
  hero: string | null;
  body: string[];
}

/* Vite resolves and fingerprints every hero at build time. A glob keeps this
   to one line instead of 13 imports, and a post referencing a missing file
   surfaces as a null hero rather than a broken <img>.

   The JSON's `im` is an absolute serving path (/assets/post-*.webp) from the
   static build, so only the filename is meaningful here — the bundler decides
   the real URL. */
const HEROES = import.meta.glob<string>("../assets/portal/blog/*.webp", {
  eager: true,
  import: "default",
});

const heroUrl = (im: string | undefined): string | null => {
  if (!im) return null;
  const file = im.split("/").pop();
  if (!file) return null;
  const match = Object.entries(HEROES).find(([path]) => path.endsWith(`/${file}`));
  return match ? match[1] : null;
};

export const POSTS: Post[] = (raw as RawPost[]).map((p) => ({
  slug: p.s,
  title: p.t,
  dek: p.k,
  category: p.c,
  author: p.a,
  date: p.d,
  hero: heroUrl(p.im),
  body: p.b,
}));

/** Posts are newest-first, so the *newer* neighbour is the LOWER index and the
 *  *older* one is higher. The static build inlined this as `POSTS[n-1]` /
 *  `POSTS[n+1]`, which reads backwards at a glance and is easy to invert —
 *  hence naming it once here instead of at each call site. */
export const neighbours = (index: number) => ({
  newer: index > 0 ? POSTS[index - 1] : undefined,
  older: index < POSTS.length - 1 ? POSTS[index + 1] : undefined,
});
