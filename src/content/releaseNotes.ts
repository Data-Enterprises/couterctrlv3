import raw from "./releaseNotes.json";

/**
 * What went out, and when — the client set.
 *
 * In the repo rather than in a bucket. Help went the same way and for the same
 * reason: a document fetched at read time can fail at read time, and a release
 * note that 403s in front of a customer is worse than one that does not exist.
 * These ship with the build, so a note is either in the app or it is not, and
 * nobody has to upload anything on release day.
 *
 * One entry per release, newest first. The date is the identity — it is what
 * the rail shows and what a link points at — so the array is ordered by it and
 * never re-sorted at runtime: a note corrected in December must not jump ahead
 * of the December release.
 *
 * Written for the people who use the product. A reader here is an owner or a
 * manager, not an engineer: no file names, no endpoints, no internal names for
 * things. If an entry cannot be written without one of those, it belongs in
 * `docs/since-last-publish.md` instead.
 */

/** What kind of change an entry is, which is all the badge says. */
export type ReleaseKind = "new" | "improved" | "fixed";

interface RawEntry {
  kind: ReleaseKind;
  /** The page or area, as a client would name it in conversation. */
  area: string;
  /** One or two sentences. What changed and why it matters, not how. */
  text: string;
}

interface RawRelease {
  /** `YYYY-MM-DD`. The identity of the release, and what the rail sorts on. */
  date: string;
  /** The headline for the note — one sentence on the release as a whole. */
  summary: string;
  entries: RawEntry[];
}

export interface ReleaseEntry extends RawEntry {}

export interface Release {
  date: string;
  /** Preformatted for the rail, from the string rather than a `Date`. */
  dateText: string;
  summary: string;
  entries: ReleaseEntry[];
}

/**
 * The date as somebody reads it.
 *
 * Split rather than parsed: the string IS the date, and handing "2026-10-20"
 * to `new Date` makes it midnight UTC, which is the day before for everyone
 * west of Greenwich. A release dated the 19th when the note says the 20th
 * would be its own little mystery.
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

/** Short form for the rail, where the full month name does not fit. */
export const dateShort = (date: string): string => {
  const [y, m, d] = date.split("-");
  return y && m && d ? `${Number(m)}/${Number(d)}/${y}` : date;
};

const KINDS: ReadonlySet<string> = new Set(["new", "improved", "fixed"]);

const isRawEntry = (v: unknown): v is RawEntry => {
  const e = v as RawEntry;
  return (
    !!e &&
    typeof e.area === "string" &&
    typeof e.text === "string" &&
    KINDS.has(e.kind)
  );
};

const expand = (r: RawRelease): Release => ({
  date: r.date,
  dateText: dateText(r.date),
  summary: r.summary,
  entries: (r.entries ?? []).filter(isRawEntry),
});

/**
 * Every release, newest first.
 *
 * Filtered rather than trusted: an entry missing a field is skipped instead of
 * rendering a half row, and a release left with no entries is dropped entirely
 * rather than appearing in the rail as a date with nothing behind it.
 */
export const RELEASES: Release[] = (raw as RawRelease[])
  .filter((r) => r && typeof r.date === "string" && Array.isArray(r.entries))
  .map(expand)
  .filter((r) => r.entries.length > 0);

/** The one a route or a rail asks for, or the newest when it asks for nothing. */
export const releaseFor = (date: string | undefined): Release | undefined =>
  (date && RELEASES.find((r) => r.date === date)) || RELEASES[0];
