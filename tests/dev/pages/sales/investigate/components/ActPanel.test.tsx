import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ActPanel from "@/pages/sales/dev/investigate/components/ActPanel";
import { judge } from "@/pages/sales/dev/investigate/utils/deptInvestigation";
import { desksOf } from "@/pages/sales/dev/investigate/utils/investigationSteps";
import type { ItemFacts, ItemVerdict } from "@/pages/sales/dev/investigate/interfaces";

/*
 * The Hand-off tab: one list per person. A row picks the list card, each
 * list's causes fold, and the list nobody is handed says why.
 */

const item = (over: Partial<ItemFacts> = {}): ItemVerdict =>
  judge({
    productCode: "0001", description: "Thing", vendorName: "AWG",
    mineTy: 0, theirsTy: 0, mineLw: 0, theirsLw: 0, mineLy: 0, theirsLy: 0,
    mineUnits: 0, theirsUnits: 0, weighted: false, mineCogs: 0, theirsCogs: 0,
    mineSales: over.mineTy ?? 0, theirsSales: over.theirsTy ?? 0,
    orderedQty: 0, receivedUnits: 0, lastOrderDate: null, lastOrderQty: 0, receivedSinceOrder: 0,
    ...over,
  });
const money = (v: number) => "$" + v.toFixed(2);

const desks = desksOf(
  [
    item({ productCode: "n1", description: "GROUND BEEF", theirsTy: 900, theirsUnits: 90 }),
    item({ productCode: "r1", description: "PORK CHOPS", mineTy: 100, mineUnits: 100, theirsTy: 300, theirsUnits: 300, orderedQty: 6 }),
    item({ productCode: "s1", description: "HOT DOGS", mineTy: 200, mineUnits: 200, theirsTy: 260, theirsUnits: 260, receivedUnits: 50 }),
  ],
  money,
);

const panel = (onExport = vi.fn(), onShow = vi.fn()) =>
  render(
    <ActPanel
      desks={desks}
      us="018"
      them="003"
      fmt={money}
      onShow={onShow}
      onExport={onExport}
      onPickItem={vi.fn()}
    />,
  );

beforeAll(() => {
  Element.prototype.scrollTo = () => {};
});

const row = (name: RegExp) =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-pressed") !== null && name.test(b.textContent ?? ""))!;

describe("Investigation Hand-off", () => {
  it("leads with how much has an owner and opens on the first person", () => {
    panel();
    expect(screen.getByText("Most of the shortfall has someone to hand it to: 2 lists, one for each desk.")).toBeInTheDocument();
    expect(row(/^Buyer/)).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 item for the buyer, worth −$900.00: never ordered at 018.")).toBeInTheDocument();
  });

  it("slides to a person's list when their row is clicked, and exports that list", () => {
    const onExport = vi.fn();
    panel(onExport);
    fireEvent.click(row(/^Receiving/));
    expect(row(/^Receiving/)).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getAllByText("Export list")[1]);
    expect(onExport.mock.calls[0][0].owner).toBe("receiving");
  });

  it("moves Show in grid to the list's header when it holds one cause", () => {
    const onShow = vi.fn();
    panel(vi.fn(), onShow);
    fireEvent.click(screen.getAllByText("Show in grid")[0]);
    expect(onShow).toHaveBeenCalledWith("never-ordered");
    expect(screen.queryByText(/never ordered \|/i)).toBeNull();
  });

  it("says what an export holds before it downloads", () => {
    panel();
    expect(screen.getAllByText("Export list")[0]).toHaveAttribute(
      "title",
      "One file with every item on this list and its cause.",
    );
  });

  it("lists every item and says why the list nobody is handed has no owner", () => {
    panel();
    fireEvent.click(row(/^Not handed/));
    expect(
      screen.getByText("Both stores sold these at about the same price and 018 sold fewer. No record names who could fix that."),
    ).toBeInTheDocument();
    expect(screen.getByText("HOT DOGS")).toBeInTheDocument();
  });
});
