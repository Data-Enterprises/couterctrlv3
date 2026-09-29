import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { categories } from "../components/navigation/utils";
import { COMING_SOON_CATEGORY } from "./comingSoon";
import { COMING_SOON_HELP_SECTIONS, comingSoonSection } from "./comingSoonHelp";

/**
 * The ids the document actually carries, read from it rather than copied.
 *
 * The document is a client hand-out that gets rewritten; a list transcribed
 * here would pass long after the section it names had been renamed.
 */
const DOC_ANCHORS = new Set(
  [...readFileSync("public/coming-soon.html", "utf8").matchAll(/id="([^"]+)"/g)].map(
    (m) => m[1],
  ),
);

const comingSoonHrefs = () =>
  categories.find((c) => c.name === COMING_SOON_CATEGORY)?.pages.map((p) => p.href) ?? [];

describe("Coming Soon help sections", () => {
  it("covers every page in the Coming Soon menu", () => {
    const hrefs = comingSoonHrefs();
    expect(hrefs.length).toBeGreaterThan(0);
    // A page added to the category with no section gets no "?" at all, which
    // is silent — this is the thing that catches it.
    expect(hrefs.filter((h) => !comingSoonSection(h))).toEqual([]);
  });

  it("only points at anchors the document actually has", () => {
    expect(DOC_ANCHORS.size).toBeGreaterThan(0);
    for (const anchor of Object.values(COMING_SOON_HELP_SECTIONS)) {
      expect([anchor, DOC_ANCHORS.has(anchor)]).toEqual([anchor, true]);
    }
  });

  it("gives nothing for a released page", () => {
    expect(comingSoonSection("sales")).toBeNull();
    expect(comingSoonSection("/sub-dept-margins")).toBeNull();
  });

  it("reads a route with or without its leading slash", () => {
    expect(comingSoonSection("/item-report")).toBe("item-actions");
    expect(comingSoonSection("item-report")).toBe("item-actions");
  });
});
