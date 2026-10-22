import { describe, expect, it } from "vitest";

/**
 * Every "Show me" in the help has something on a page to point at.
 *
 * A help step or glossary term names an `anchor`, and the panel lights up the
 * element carrying `data-help` with that name. Nothing connected the two, so an
 * anchor could name an element that was renamed or removed, and the button
 * would quietly say "Not on screen right now" forever. The dev board review
 * found the other side of the same gap: Sales glossary terms with no anchor at
 * all, and guide steps pointing at a control the card they described wasn't in
 * (findings AF and AD).
 *
 * Read from source rather than rendered: an anchor only has to exist on SOME
 * page in SOME state, which rendering one page could never show.
 */

const content = import.meta.glob<string>("./content/*.ts", {
  query: "?raw",
  import: "default",
  eager: true,
});

const pages = import.meta.glob<string>(
  ["/src/**/*.tsx", "!/src/legacy/**", "!/src/**/*.test.tsx"],
  { query: "?raw", import: "default", eager: true },
);

const named = new Map<string, string>();
for (const [file, src] of Object.entries(content)) {
  for (const m of src.matchAll(/anchor:\s*"([^"]+)"/g)) named.set(m[1], file);
}

const present = new Set<string>();
for (const src of Object.values(pages)) {
  // A literal attribute, a template with no interpolation, or a prop that a
  // component forwards to its own `data-help` (CompanyPicker's `helpAnchor`).
  for (const m of src.matchAll(/data-help="([^"]+)"/g)) present.add(m[1]);
  for (const m of src.matchAll(/data-help=\{`([^`$]+)`\}/g)) present.add(m[1]);
  for (const m of src.matchAll(/helpAnchor="([^"]+)"/g)) present.add(m[1]);
}

describe("help anchors", () => {
  it("found the help content and the pages", () => {
    expect(Object.keys(content).length).toBeGreaterThan(10);
    expect(Object.keys(pages).length).toBeGreaterThan(100);
  });

  it("names nothing that no page carries", () => {
    const dead = [...named.entries()]
      .filter(([anchor]) => !present.has(anchor))
      .map(([anchor, file]) => `${anchor}  (${file})`);
    expect(dead).toEqual([]);
  });
});
