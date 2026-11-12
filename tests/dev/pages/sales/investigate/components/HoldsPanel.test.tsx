import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import HoldsPanel from "@/pages/sales/dev/investigate/components/HoldsPanel";
import { judge } from "@/pages/sales/dev/investigate/utils/deptInvestigation";
import { rowsOf } from "@/pages/sales/dev/investigate/utils/holdsRows";
import { summarise } from "@/pages/sales/dev/investigate/utils/investigationFacts";
import { holdsUp, spreadOf, vitalsOf } from "@/pages/sales/dev/investigate/utils/investigationSteps";
import type { ItemFacts, ItemVerdict } from "@/pages/sales/dev/investigate/interfaces";

/*
 * The Summary's rows pick the items card: clicking a row slides the card to
 * that row's items, and the card's own tabs pick the row back.
 */

const item = (over: Partial<ItemFacts> = {}): ItemVerdict =>
  judge({
    productCode: "0001",
    description: "Thing",
    vendorName: "Acme",
    mineTy: 0, theirsTy: 0, mineLw: 0, theirsLw: 0, mineLy: 0, theirsLy: 0,
    mineUnits: 0, theirsUnits: 0, weighted: false, mineCogs: 0, theirsCogs: 0,
    mineSales: over.mineTy ?? 0,
    theirsSales: over.theirsTy ?? 0,
    orderedQty: 0, receivedUnits: 0,
    lastOrderDate: null, lastOrderQty: 0, receivedSinceOrder: 0,
    ...over,
  });

const items = [
  item({ productCode: "t1", description: "GROUND BEEF", theirsTy: 900, theirsUnits: 90 }),
  item({ productCode: "l1", description: "HOT DOGS", mineTy: 100, mineUnits: 100, theirsTy: 300, theirsUnits: 300 }),
  item({ productCode: "m1", description: "PORK LOIN", mineTy: 200, mineUnits: 100, theirsTy: 100, theirsUnits: 50 }),
];

const money = (v: number) => "$" + v.toFixed(2);

const panel = () =>
  render(
    <HoldsPanel
      holds={holdsUp(items, "price", "018", "003")}
      rows={rowsOf(items)}
      spread={spreadOf(items)}
      summary={summarise(items)}
      us="018 - PLF LOUISVILLE KY"
      them="003 - IGA HUNTSVILLE AL"
      vitals={vitalsOf(items)}
      fmt={money}
      cash={money}
      marginGap={0}
      costPenalty={-0.001}
      onPickItem={vi.fn()}
      onVendor={vi.fn()}
      onSeeAll={vi.fn()}
    />,
  );

beforeAll(() => {
  // jsdom lays nothing out and has no scrollTo on elements.
  Element.prototype.scrollTo = () => {};
});

const row = (name: RegExp) =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-pressed") !== null && name.test(b.textContent ?? ""))!;
const tab = (name: RegExp) =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-current") !== null && name.test(b.textContent ?? ""))!;

describe("Investigation Summary rows", () => {
  it("opens on the row with the most money in it, named by store", () => {
    panel();
    expect(row(/Rang at003only/)).toHaveAttribute("aria-pressed", "true");
    expect(tab(/003 only/)).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("The one item was never ordered.")).toBeInTheDocument();
  });

  it("slides the items card to a row when the row is clicked", () => {
    panel();
    fireEvent.click(row(/sold less/));
    expect(row(/sold less/)).toHaveAttribute("aria-pressed", "true");
    expect(row(/Rang at003only/)).toHaveAttribute("aria-pressed", "false");
    expect(tab(/018 sold less/)).toHaveAttribute("aria-current", "true");
  });

  it("picks the row back when the card's own tab is clicked", () => {
    panel();
    fireEvent.click(tab(/018 sold more/));
    expect(row(/sold more/)).toHaveAttribute("aria-pressed", "true");
  });

  it("shows no margin note for a penalty that rounds to $0.00", () => {
    panel();
    expect(screen.queryByText(/Buying the same goods for more/)).toBeNull();
  });
});
