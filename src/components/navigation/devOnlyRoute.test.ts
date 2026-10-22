import { describe, expect, it } from "vitest";
import { categories, isComingSoonRoute, isDevOnlyRoute } from "./utils";
import { COMING_SOON_CATEGORY } from "../../utils/comingSoon";

const comingSoonHrefs =
  categories.find((c) => c.name === COMING_SOON_CATEGORY)?.pages.map((p) => p.href) ?? [];

describe("isComingSoonRoute", () => {
  it("knows every page in the Coming Soon menu", () => {
    expect(comingSoonHrefs.length).toBeGreaterThan(0);
    expect(comingSoonHrefs.filter((h) => !isComingSoonRoute(h))).toEqual([]);
  });

  it("says no to released pages", () => {
    for (const href of ["sales", "sub-dept-margins", "orders", "cashiers"]) {
      expect([href, isComingSoonRoute(href)]).toEqual([href, false]);
    }
  });

  it("tolerates a leading slash", () => {
    const [first] = comingSoonHrefs;
    expect(isComingSoonRoute(`/${first}`)).toBe(true);
    expect(isComingSoonRoute("/sales")).toBe(false);
  });

  it("says no to the empty route", () => {
    expect(isComingSoonRoute("/")).toBe(false);
    expect(isComingSoonRoute("")).toBe(false);
  });
});

describe("isDevOnlyRoute", () => {
  it("covers the Coming Soon pages", () => {
    expect(comingSoonHrefs.filter((h) => !isDevOnlyRoute(h))).toEqual([]);
  });

  // Named explicitly rather than read off the nav, because Release Notes is
  // not in the nav at all. Closed for timing now rather than for content — the
  // notes are the client set, but nothing is announced before the switchover.
  it("covers Release Notes, which is not in the nav at all", () => {
    expect(isComingSoonRoute("release-notes")).toBe(false);
    expect(isDevOnlyRoute("release-notes")).toBe(true);
    expect(isDevOnlyRoute("/release-notes")).toBe(true);
  });

  it("says no to released pages", () => {
    for (const href of ["sales", "orders", "item-lookup", "/"]) {
      expect([href, isDevOnlyRoute(href)]).toEqual([href, false]);
    }
  });
});
