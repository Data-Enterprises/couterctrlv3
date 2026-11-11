import { describe, expect, it } from "vitest";
import { categories } from "../components/navigation/utils";
import {
  NOTE_KINDS,
  RELEASES,
  SAMPLE_RELEASES,
  dateText,
  lastChangedRelease,
  notesFor,
  parseReleases,
  smallerFor,
} from "./releaseNotes";

describe("parseReleases", () => {
  it("drops notes with no kind, page or sentence, and releases left with nothing", () => {
    const out = parseReleases([
      {
        date: "2026-11-11",
        items: [
          { kind: "new", page: "Sales", hrefs: ["sales"], text: "Summary tab." },
          { kind: "shiny", page: "Sales", hrefs: ["sales"], text: "x" },
          { kind: "fix", page: "", hrefs: [], text: "x" },
          { kind: "fix", page: "Orders", hrefs: ["orders"], text: " " },
        ],
        smallerFixes: [
          { page: "Sales", hrefs: ["sales"], count: 2 },
          { page: "Coupons", hrefs: ["coupons"], count: 0 },
        ],
      },
      { date: "2026-10-20", items: [], smallerFixes: [] },
      { items: [{ kind: "new", page: "x", text: "no date" }] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].items.map((n) => n.text)).toEqual(["Summary tab."]);
    expect(out[0].items[0].newPage).toBe(false);
    expect(out[0].smallerFixes.map((s) => s.page)).toEqual(["Sales"]);
  });

  it("keeps the order written, newest first, rather than re-sorting", () => {
    const n = [{ kind: "fix", page: "p", hrefs: [], text: "t" }];
    const out = parseReleases([
      { date: "2026-09-22", items: n },
      { date: "2026-11-02", items: n },
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
      date: "2026-11-11",
      items: [
        { kind: "new", page: "Sales", hrefs: ["sales"], text: "a" },
        { kind: "fix", page: "Performance on a phone", hrefs: ["sales", "vendors"], text: "b" },
        { kind: "fix", page: "Vendors", hrefs: ["vendors"], text: "c" },
      ],
      smallerFixes: [{ page: "Sales", hrefs: ["sales"], count: 4 }],
    },
  ]);

  it("finds every note about a route, from any of its hrefs", () => {
    expect(notesFor(release, "sales").map((n) => n.text)).toEqual(["a", "b"]);
    expect(notesFor(release, "vendors").map((n) => n.text)).toEqual(["b", "c"]);
  });

  it("counts a route's smaller fixes", () => {
    expect(smallerFor(release, "sales")).toBe(4);
    expect(smallerFor(release, "vendors")).toBe(0);
  });

  it("finds the newest release that touched a page, smaller fixes included", () => {
    const n = (page: string, href: string) => [{ kind: "fix", page, hrefs: [href], text: "x" }];
    const older = parseReleases([
      { date: "2026-12-01", items: n("Orders", "orders") },
      { date: "2026-11-20", smallerFixes: [{ page: "Coupons", hrefs: ["coupons"], count: 1 }] },
      { date: "2026-11-02", items: n("Sales", "sales") },
    ]);
    expect(lastChangedRelease(older, "sales")?.date).toBe("2026-11-02");
    expect(lastChangedRelease(older, "coupons")?.date).toBe("2026-11-20");
    expect(lastChangedRelease(older, "groups")).toBeUndefined();
  });
});

describe("the notes shipped with the app", () => {
  it("has no real releases yet: those are written at the move to prod", () => {
    expect(RELEASES).toEqual([]);
  });

  it("has a sample that uses every kind and counts smaller fixes", () => {
    const latest = SAMPLE_RELEASES[0];
    for (const k of NOTE_KINDS)
      expect(latest.items.some((n) => n.kind === k)).toBe(true);
    expect(latest.smallerFixes.length).toBeGreaterThan(0);
  });

  it("points every note at a route the menu really has", () => {
    // A note whose href matches no page could never be opened onto, and would
    // only show up as a page that never gets its You're here card.
    const routes = new Set(
      categories.flatMap((c) => c.pages.map((p) => p.href)),
    );
    const unknown = SAMPLE_RELEASES.flatMap((r) => [
      ...r.items.flatMap((n) => n.hrefs),
      ...r.smallerFixes.flatMap((s) => s.hrefs),
    ]).filter((h) => !routes.has(h));
    expect(unknown).toEqual([]);
  });
});
