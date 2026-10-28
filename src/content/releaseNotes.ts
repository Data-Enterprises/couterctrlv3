import raw from "./releaseNotes.json";
import sampleRaw from "./releaseNotes.sample.json";

/**
 * What changed on the production screens, and when.
 *
 * Prod only. Dev's release notes are the weekly meeting doc, written for the
 * support team; these are the client set, and nothing that has not reached the
 * production screens belongs here. Coming Soon pages appear only once they
 * leave Coming Soon, under Now available.
 *
 * In the repo rather than in a bucket: a document fetched at read time can fail
 * at read time, and a release note that 403s in front of a customer is worse
 * than one that does not exist. These ship with the build.
 *
 * One entry per release, newest first, in the order written. The date is the
 * identity, so the array is never re-sorted at runtime: a note corrected in
 * December must not jump ahead of the December release.
 *
 * HOW A BULLET READS
 * Lead with the feature's name as the app calls it. A change to something
 * clients already know is just the name ("Hash sales"). A new control or choice
 * adds what it lets them do and where it takes effect ("Sub dept exclusions:
 * choose which sub departments to exclude. The Performance pages leave them
 * out."). Never the mechanism, never the old behaviour, never "fixed" or
 * "now", never steps. A behaviour with no feature name is one short sentence.
 */

/** A page's bullets within one section of one release. */
export interface ReleasePage {
  /** The full menu path, as the client reads it: `Config → User Management`. */
  page: string;
  /**
   * The routes this heading is about, which is what the window matches the
   * page you are on against. Never the heading text: that is worded for
   * people and would break the first time it differed from the menu. A
   * combined heading ("Vendors, Sub Dept Margins") lists every route.
   */
  hrefs: string[];
  bullets: string[];
}

/** The three sections that hold pages. Platform Updates holds bullets alone,
 *  since its changes reach every page. */
export type PageSection = "nowAvailable" | "updates" | "fixes";

export interface Release {
  /** `YYYY-MM-DD`. The identity of the release, and what the rail shows. */
  date: string;
  dateText: string;
  platform: string[];
  /** Pages that left Coming Soon for production. */
  nowAvailable: ReleasePage[];
  updates: ReleasePage[];
  fixes: ReleasePage[];
}

export const PAGE_SECTIONS: PageSection[] = ["nowAvailable", "updates", "fixes"];

/** The section titles, written for clients rather than for us. */
export const SECTION_TITLE: Record<PageSection | "platform", string> = {
  platform: "Platform Updates",
  nowAvailable: "Now available",
  updates: "Updates",
  fixes: "Fixes",
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

/** Short form for the rail, where the full month name does not fit. */
export const dateShort = (date: string): string => {
  const [y, m, d] = date.split("-");
  return y && m && d ? `${Number(m)}/${Number(d)}/${y}` : date;
};

const strings = (v: unknown): string[] =>
  Array.isArray(v)
    ? v.filter((s): s is string => typeof s === "string" && s.trim() !== "")
    : [];

const pages = (v: unknown): ReleasePage[] =>
  (Array.isArray(v) ? v : [])
    .map((p) => {
      const o = (p ?? {}) as Partial<ReleasePage>;
      return {
        page: typeof o.page === "string" ? o.page : "",
        hrefs: strings(o.hrefs),
        bullets: strings(o.bullets),
      };
    })
    .filter((p) => p.page !== "" && p.bullets.length > 0);

/**
 * Releases from the JSON, checked rather than trusted.
 *
 * A heading with no bullets is dropped instead of rendering as an empty
 * heading, and a release left with nothing in it is dropped entirely rather
 * than appearing in the rail as a date with nothing behind it.
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
        platform: strings(o.platform),
        nowAvailable: pages(o.nowAvailable),
        updates: pages(o.updates),
        fixes: pages(o.fixes),
      };
    })
    .filter(
      (r) =>
        r.platform.length > 0 ||
        PAGE_SECTIONS.some((s) => r[s].length > 0),
    );

/** The real ones. Empty until the first production release is written up. */
export const RELEASES: Release[] = parseReleases(raw);

/**
 * Made-up notes in the real format, for trying the window in dev before the
 * first real release. Never shown on prod, and the window says it is a sample.
 */
export const SAMPLE_RELEASES: Release[] = parseReleases(sampleRaw);

/** Where a route appears in a release: each section and heading that names
 *  it, in the order the window draws them. */
export const pageHits = (
  release: Release,
  href: string,
): { section: PageSection; index: number }[] =>
  PAGE_SECTIONS.flatMap((section) =>
    release[section]
      .map((p, index) => (p.hrefs.includes(href) ? { section, index } : null))
      .filter((hit): hit is { section: PageSection; index: number } => !!hit),
  );

/** The newest release that names a route at all, for "Last changed …". */
export const lastChangedRelease = (
  releases: Release[],
  href: string,
): Release | undefined =>
  releases.find((r) => pageHits(r, href).length > 0);
