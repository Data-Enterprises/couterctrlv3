import { describe, expect, it } from "vitest";
import { categories } from "../components/navigation/utils";
import {
  PAGE_SECTIONS,
  RELEASES,
  SAMPLE_RELEASES,
  dateText,
  lastChangedRelease,
  pageHits,
  parseReleases,
} from "./releaseNotes";

describe("parseReleases", () => {
  it("drops headings with no bullets, and releases left with nothing", () => {
    const out = parseReleases([
      {
        date: "2026-11-02",
        platform: ["Hash sales", ""],
        updates: [
          { page: "Data → Orders", hrefs: ["orders"], bullets: [] },
          { page: "Performance → Sales", hrefs: ["sales"], bullets: ["Top 200"] },
        ],
      },
      { date: "2026-10-20", platform: [], updates: [] },
      { platform: ["no date"] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].platform).toEqual(["Hash sales"]);
    expect(out[0].updates.map((p) => p.page)).toEqual(["Performance → Sales"]);
    expect(out[0].fixes).toEqual([]);
  });

  it("keeps the order written, newest first, rather than re-sorting", () => {
    const out = parseReleases([
      { date: "2026-09-22", platform: ["a"] },
      { date: "2026-11-02", platform: ["b"] },
    ]);
    expect(out.map((r) => r.date)).toEqual(["2026-09-22", "2026-11-02"]);
  });

  it("reads the date without a timezone shift", () => {
    expect(dateText("2026-11-02")).toBe("November 2, 2026");
  });
});

describe("finding the page you are on", () => {
  const [release] = parseReleases([
    {
      date: "2026-11-02",
      updates: [{ page: "Performance → Sales", hrefs: ["sales"], bullets: ["x"] }],
      fixes: [
        {
          page: "Performance → Vendors, Sub Dept Margins",
          hrefs: ["vendors", "sub-dept-margins"],
          bullets: ["y"],
        },
        { page: "Performance → Sales", hrefs: ["sales"], bullets: ["z"] },
      ],
    },
  ]);

  it("names every section the page appears in, fixes included", () => {
    expect(pageHits(release, "sales")).toEqual([
      { section: "updates", index: 0 },
      { section: "fixes", index: 1 },
    ]);
  });

  it("matches a combined heading from either of its pages", () => {
    expect(pageHits(release, "sub-dept-margins")).toEqual([
      { section: "fixes", index: 0 },
    ]);
  });

  it("finds the newest release that touched a page", () => {
    const older = parseReleases([
      { date: "2026-12-01", platform: ["p"] },
      { date: "2026-11-02", updates: [{ page: "S", hrefs: ["sales"], bullets: ["x"] }] },
    ]);
    expect(lastChangedRelease(older, "sales")?.date).toBe("2026-11-02");
    expect(lastChangedRelease(older, "orders")).toBeUndefined();
  });
});

describe("the notes shipped with the app", () => {
  it("has no real releases yet: those are written at the move to prod", () => {
    expect(RELEASES).toEqual([]);
  });

  it("has a sample that uses every section, for trying the window", () => {
    const latest = SAMPLE_RELEASES[0];
    expect(latest.platform.length).toBeGreaterThan(0);
    for (const s of PAGE_SECTIONS) expect(latest[s].length).toBeGreaterThan(0);
  });

  it("points every heading at a route the menu really has", () => {
    // A heading whose href matches no page could never be opened onto, and
    // would only show up as a page that never gets marked.
    const routes = new Set(
      categories.flatMap((c) => c.pages.map((p) => p.href)),
    );
    const unknown = SAMPLE_RELEASES.flatMap((r) =>
      PAGE_SECTIONS.flatMap((s) => r[s].flatMap((p) => p.hrefs)),
    ).filter((h) => !routes.has(h));
    expect(unknown).toEqual([]);
  });
});
