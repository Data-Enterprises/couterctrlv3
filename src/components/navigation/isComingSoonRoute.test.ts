import { describe, expect, it } from "vitest";
import { categories, isComingSoonRoute } from "./utils";
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
