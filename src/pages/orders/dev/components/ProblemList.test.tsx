import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProblemList from "./ProblemList";
import type { ProblemItem } from "../problemItems";

const item = (over: Partial<ProblemItem>): ProblemItem => ({
  code: "X",
  desc: "X",
  flags: [],
  stores: 1,
  orders: 1,
  topMargin: null,
  staged: 0,
  ...over,
});

/**
 * As `itemsInScope` hands them over: a missing cost is listed once, under
 * Missing cost, not again as a 100% margin (see problemItems.test). Two
 * genuinely high-margin items, one no-case-size item.
 */
const ITEMS = [
  item({ code: "M1", desc: "MISSING ONE", flags: ["missingCost"] }),
  item({ code: "M2", desc: "MISSING TWO", flags: ["missingCost"] }),
  item({ code: "H1", desc: "HIGH ONE", flags: ["highMargin"], topMargin: 91 }),
  item({ code: "H2", desc: "HIGH TWO", flags: ["highMargin"], topMargin: 75 }),
  item({ code: "C1", desc: "CASE ONE", flags: ["noCaseSize"] }),
];

const setup = () =>
  render(
    <ProblemList
      items={ITEMS}
      skipped={new Set()}
      openCode={null}
      onPick={() => undefined}
      marginOver={60}
      onMarginOver={() => undefined}
      scopeOrders={5}
      scopeStores={2}
    />,
  );

/** The item cards, by their description, top to bottom. */
const listed = () =>
  screen
    .getAllByRole("button")
    .filter((b) => b.tagName === "BUTTON")
    .map((b) => within(b).queryByText(/ONE|TWO/)?.textContent)
    .filter(Boolean);

const row = (name: RegExp) =>
  screen.getAllByRole("button").find((b) => b.tagName === "DIV" && name.test(b.textContent ?? ""))!;

describe("Problems tab flag rows", () => {
  it("narrows the list to the flag clicked", async () => {
    setup();
    expect(listed()).toHaveLength(5);
    await userEvent.click(row(/No case size/));
    expect(listed()).toEqual(["CASE ONE"]);
  });

  it("shows only the high-margin items under High margin", async () => {
    setup();
    await userEvent.click(row(/High margin over/));
    expect(listed()).toEqual(["HIGH ONE", "HIGH TWO"]);
  });

  it("counts each row the way it filters", () => {
    setup();
    expect(row(/Missing cost/).textContent).toMatch(/2$/);
    expect(row(/High margin over/).textContent).toMatch(/2$/);
    expect(row(/No case size/).textContent).toMatch(/1$/);
  });

  it("says how many are showing once a row is on", async () => {
    setup();
    await userEvent.click(row(/Missing cost/));
    expect(screen.getByText(/2 of 5 showing/)).toBeTruthy();
  });
});
