import raw from "./posts.json";

/** Field Notes articles.
 *
 *  Two sources, on purpose. `posts.json` beside this file ships with the build
 *  and renders instantly; Login then fetches the bucket's copy and replaces it
 *  if that succeeds. So a new post published to the bucket appears without a
 *  deploy, and a failed fetch still leaves a populated panel.
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

/* Hero images are still bundled, matched to a post by filename. The bucket's
   `im` values are serving paths (/assets/post-*.webp) rather than URLs, so
   only the filename is meaningful — the bundler decides the real URL.

   This is the one piece of blog content the build still carries. Once the 13
   images are in the bucket and `im` carries a full URL, the branch below
   short-circuits and this glob can go. A post whose image isn't bundled gets
   a null hero and renders without art, rather than a broken <img>. */
const HEROES = import.meta.glob<string>("../assets/portal/blog/*.webp", {
  eager: true,
  import: "default",
});

const heroUrl = (im: string | undefined): string | null => {
  if (!im) return null;
  // Once images move to the bucket, `im` arrives as a full URL — use it as-is.
  if (/^https?:\/\//i.test(im)) return im;
  const file = im.split("/").pop();
  if (!file) return null;
  const match = Object.entries(HEROES).find(([path]) => path.endsWith(`/${file}`));
  return match ? match[1] : null;
};

/* The authored copy carries a few HTML entities — "Orders &amp; Coupons",
   "P&amp;L" — because it was written for a build that injected it via
   innerHTML. JSX escapes instead, so those render literally unless decoded
   here. Handles the five entities actually present; anything else stays as
   written rather than being guessed at. */
const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const decode = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (m) => ENTITIES[m]);

const expand = (p: RawPost): Post => ({
  slug: p.s,
  title: decode(p.t),
  dek: decode(p.k),
  category: decode(p.c),
  author: decode(p.a),
  date: p.d,
  hero: heroUrl(p.im),
  body: p.b.map(decode),
});

/** The copy that ships with the build. Rendered immediately, then replaced if
 *  the bucket fetch succeeds — so the panel is never empty. */
export const POSTS: Post[] = (raw as RawPost[]).map(expand);

const isRawPost = (v: unknown): v is RawPost => {
  const p = v as RawPost;
  return (
    !!p && typeof p.s === "string" && typeof p.t === "string" && Array.isArray(p.b)
  );
};

/** Normalise the bucket's `posts.json` into `Post[]`.
 *
 *  Deliberately tolerant: it accepts a bare array or `{ posts: [...] }`, and
 *  skips entries missing the fields the panel reads rather than rendering a
 *  broken row. `[]` means nothing usable came back, which the caller surfaces
 *  as the empty state. */
export const toPosts = (data: unknown): Post[] => {
  const arr: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { posts?: unknown } | null)?.posts)
      ? (data as { posts: unknown[] }).posts
      : [];
  return arr.filter(isRawPost).map(expand);
};

/** Posts are newest-first, so the *newer* neighbour is the LOWER index and the
 *  *older* one is higher. The static build inlined this as `POSTS[n-1]` /
 *  `POSTS[n+1]`, which reads backwards at a glance and is easy to invert —
 *  hence naming it once here instead of at each call site. */
export const neighbours = (posts: Post[], index: number) => ({
  newer: index > 0 ? posts[index - 1] : undefined,
  older: index < posts.length - 1 ? posts[index + 1] : undefined,
});
