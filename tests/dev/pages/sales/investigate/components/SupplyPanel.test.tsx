import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import SupplyPanel from "@/pages/sales/dev/investigate/components/SupplyPanel";
import { judge } from "@/pages/sales/dev/investigate/utils/deptInvestigation";
import { supplyOf } from "@/pages/sales/dev/investigate/utils/investigationSteps";
import type { ItemFacts } from "@/pages/sales/dev/investigate/interfaces";
import type { AllOrder, ReceiverItemSearchReceiver } from "@/interfaces";

/*
 * The Supply tab's rows pick the documents card, one store's orders or
 * receipts at a time, and the card's tabs pick the row back.
 */

const order = (id: number, qty: number, order_date: string) =>
  ({ order_id: id, order_date, status: "OPEN", product_code: "a", qty, vendor_name: "AWG", description: "Thing" }) as unknown as AllOrder;
const inv = (id: number, qty: number, cost: number, invoice_date: string) =>
  ({
    invoiceid: id, invoice_date, vendor_name: "AWG",
    lines: [{ product_code: "a", qty, ext_cost: cost, item_return: 0, product_description: "Thing" }],
  }) as unknown as ReceiverItemSearchReceiver;
const item = judge({
  productCode: "a", description: "Thing", vendorName: "AWG",
  mineTy: 0, theirsTy: 10, mineLw: 0, theirsLw: 0, mineLy: 0, theirsLy: 0,
  mineUnits: 0, theirsUnits: 1, weighted: false, mineCogs: 0, theirsCogs: 0,
  mineSales: 0, theirsSales: 10, orderedQty: 0, receivedUnits: 0,
  lastOrderDate: null, lastOrderQty: 0, receivedSinceOrder: 0,
} as ItemFacts);

const mineOrders = [order(37189, 63, "2026-11-03"), order(37180, 626, "2026-11-01")];
const theirOrders = [order(2576, 11, "2026-11-02")];
const theirReceipts = [inv(88214, 520, 1402.1, "2026-10-31")];

const panel = (receiptsOk = true) =>
  render(
    <SupplyPanel
      supply={supplyOf(
        { mine: mineOrders, theirs: theirOrders },
        { mine: [], theirs: receiptsOk ? theirReceipts : [] },
        [item],
      )}
      us="018 - PLF LOUISVILLE KY"
      them="003 - IGA HUNTSVILLE AL"
      window={{ start: "2026-09-27", end: "2026-11-08" }}
      cash={(v) => "$" + v.toFixed(2)}
      orders={{ ok: true, inWindow: 3, mine: mineOrders, theirs: theirOrders, allMine: mineOrders, allTheirs: theirOrders }}
      receipts={{ ok: receiptsOk, mine: [], theirs: receiptsOk ? theirReceipts : [] }}
      upcQuery=""
      onUpcQuery={vi.fn()}
    />,
  );

beforeAll(() => {
  Element.prototype.scrollTo = () => {};
});

const row = (name: RegExp) =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-pressed") !== null && name.test(b.textContent ?? ""))!;
const tab = (name: RegExp) =>
  screen.getAllByRole("button").find((b) => b.getAttribute("aria-current") !== null && name.test(b.textContent ?? ""))!;

describe("Investigation Supply rows", () => {
  it("opens on this store's orders, named by store", () => {
    panel();
    expect(row(/Ordered at018/)).toHaveAttribute("aria-pressed", "true");
    expect(tab(/018 orders/)).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("units ordered at 018, against", { exact: false })).toBeInTheDocument();
  });

  it("slides the documents card to a row when the row is clicked", () => {
    panel();
    fireEvent.click(row(/Received at003/));
    expect(row(/Received at003/)).toHaveAttribute("aria-pressed", "true");
    expect(tab(/003 receivers/)).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("1 receiver at 003: 520 units, $1402.10.")).toBeInTheDocument();
  });

  it("opens an order to its lines under UPC, Item and Units, with no Cost", () => {
    panel();
    const button = screen.getByText("#37189").closest("button")!;
    fireEvent.click(button);
    const doc = within(button.parentElement!);
    expect(doc.getByText("UPC")).toBeInTheDocument();
    expect(doc.getByText("Units")).toBeInTheDocument();
    expect(doc.queryByText("Cost")).toBeNull();
  });

  it("opens a receipt to its lines with their Cost", () => {
    panel();
    fireEvent.click(row(/Received at003/));
    const button = screen.getByText("#88214").closest("button")!;
    fireEvent.click(button);
    const doc = within(button.parentElement!);
    expect(doc.getByText("Cost")).toBeInTheDocument();
    expect(doc.getAllByText("$1402.10")).toHaveLength(2);
  });

  it("says the receipts could not be read rather than that nothing arrived", () => {
    panel(false);
    expect(screen.getByText("Both stores ordered. The receivers couldn't be read.")).toBeInTheDocument();
    expect(row(/Received at018/)).toHaveTextContent("not read");
  });
});
