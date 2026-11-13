import raw from "./releaseNotes.json";
import sampleRaw from "./releaseNotes.sample.json";

/**
 * What changed on the production screens, and when.
 *
 * Prod only. Dev's release notes are the weekly meeting doc, written for the
 * support team; these are the client set, and nothing that has not reached the
 * production screens belongs here.
 *
 * In the repo rather than in a bucket: a document fetched at read time can fail
 * at read time, and a release note that 403s in front of a customer is worse
 * than one that does not exist. These ship with the build.
 *
 * One entry per release, newest first, in the order written. The date is the
 * identity, so the array is never re-sorted at runtime: a note corrected in
 * December must not jump ahead of the December release.
 *
 * Where they come from: the Production Update Guide's builder writes the next
 * release's notes from the guide's cards, and at the move that set is copied in
 * here with its date.
 *
 * HOW A NOTE READS
 * One plain sentence a client understands at a glance: the main point of the
 * change, never the mechanism and never steps. Owner-only and level 9 changes
 * stay out. A page's smaller fixes are counted, not written out.
 */

/** New to production, an improvement to something clients know, or a fix. */
export type NoteKind = "new" | "improvement" | "fix";

/** One release note: one sentence about one page. */
export interface ReleaseNote {
  kind: NoteKind;
  /** The page as the menu names it, or "Every page". */
  page: string;
  /**
   * The routes the note is about, which is what the panel matches the page
   * you are on against. Never the page text: that is worded for people. Empty
   * for "Every page".
   */
  hrefs: string[];
  /** The page itself is new to production. */
  newPage: boolean;
  text: string;
}

/** A page's smaller fixes, counted rather than written out. */
export interface SmallerFixes {
  page: string;
  hrefs: string[];
  count: number;
}

export interface Release {
  /** `YYYY-MM-DD`. The identity of the release, and what the picker shows. */
  date: string;
  dateText: string;
  items: ReleaseNote[];
  smallerFixes: SmallerFixes[];
}

/** The kinds in the order the panel draws them. */
export const NOTE_KINDS: NoteKind[] = ["new", "improvement", "fix"];

/** The section titles, written for clients rather than for us. */
export const KIND_TITLE: Record<NoteKind, string> = {
  new: "New",
  improvement: "Improvements",
  fix: "Fixes",
};

/**
 * The date as somebody reads it.
 *
 * Split rather than parsed: the string IS the date, and handing "2026-10-20"
 * to `new Date` makes it midnight UTC, which is the day before for everyone
 * west of Greenwich.
 */
export const dateText = (date: string): string => {
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return date;
  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const name = MONTHS[Number(m) - 1];
  return name ? `${name} ${Number(d)}, ${y}` : date;
};

const text = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : [];

const isKind = (v: unknown): v is NoteKind =>
  typeof v === "string" && (NOTE_KINDS as string[]).includes(v);

const notes = (v: unknown): ReleaseNote[] =>
  (Array.isArray(v) ? v : [])
    .map((n) => {
      const o = (n ?? {}) as Record<string, unknown>;
      return {
        kind: isKind(o.kind) ? o.kind : null,
        page: text(o.page),
        hrefs: strings(o.hrefs),
        newPage: o.newPage === true,
        text: text(o.text),
      };
    })
    .filter((n): n is ReleaseNote => !!n.kind && n.page !== "" && n.text !== "");

const smaller = (v: unknown): SmallerFixes[] =>
  (Array.isArray(v) ? v : [])
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return {
        page: text(o.page),
        hrefs: strings(o.hrefs),
        count: typeof o.count === "number" ? Math.floor(o.count) : 0,
      };
    })
    .filter((s) => s.page !== "" && s.count > 0);

/**
 * Releases from the JSON, checked rather than trusted.
 *
 * A note with no kind, page or sentence is dropped instead of rendering as an
 * empty row, and a release left with nothing in it is dropped entirely rather
 * than appearing in the picker as a date with nothing behind it.
 */
export const parseReleases = (input: unknown): Release[] =>
  (Array.isArray(input) ? input : [])
    .filter(
      (r): r is { date: string } =>
        !!r && typeof (r as { date?: unknown }).date === "string",
    )
    .map((r) => {
      const o = r as Record<string, unknown>;
      return {
        date: r.date,
        dateText: dateText(r.date),
        items: notes(o.items),
        smallerFixes: smaller(o.smallerFixes),
      };
    })
    .filter((r) => r.items.length > 0 || r.smallerFixes.length > 0);

/** The real ones. Empty until the first production release is written up. */
export const RELEASES: Release[] = parseReleases(raw);

/**
 * Notes in the real format, for trying the panel in dev before the first real
 * release. Never shown on prod, and the panel says it is a sample.
 */
export const SAMPLE_RELEASES: Release[] = parseReleases(sampleRaw);

/** A release's notes about one route, in the order written. */
export const notesFor = (release: Release, href: string): ReleaseNote[] =>
  release.items.filter((n) => n.hrefs.includes(href));

/** How many smaller fixes a release made on one route. */
export const smallerFor = (release: Release, href: string): number =>
  release.smallerFixes
    .filter((s) => s.hrefs.includes(href))
    .reduce((n, s) => n + s.count, 0);

/** The newest release that touched a route at all, for "Last changed …". */
export const lastChangedRelease = (
  releases: Release[],
  href: string,
): Release | undefined =>
  releases.find(
    (r) => notesFor(r, href).length > 0 || smallerFor(r, href) > 0,
  );
