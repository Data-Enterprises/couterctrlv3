// Utils
import { codeOf } from "../../utils";
import { noReceiptsNote, supplySlideSays, supplyTab } from "./supplyRows";

// Interfaces
import type { OrdersWave, ReceiptsWave } from "../../utils/investigationData";
import type { Supply, SupplyRecord } from "../../utils/investigationSteps";
import type { AllOrder } from "../../../../../../interfaces";
import type { DocLine, SupplyRow } from "../../interfaces";

/** The codes the reader is asking about, if any. Commas, spaces or new lines,
 *  because all three are what a paste brings with it. */
export const wantedCodes = (query: string) =>
  new Set(
    query
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean),
  );

/** A whole number with thousands separators. */
export const countText = (v: number) => Math.round(v).toLocaleString("en-US");

/** "1 order", "3 orders". */
export const plural = (k: number, one: string) =>
  `${countText(k)} ${one}${k === 1 ? "" : "s"}`;

const asLines = (rows: AllOrder[]): DocLine[] =>
  rows.map((o) => ({
    code: codeOf(o.product_code),
    description: o.description,
    units: o.qty,
    cost: 0,
  }));

/** Each document's lines: an order's in this department, the same order
 *  entire (it came down with the same request), and a receiver's. */
export const documentLines = (orders: OrdersWave, receipts: ReceiptsWave) => ({
  orderLines: (id: number, mine: boolean) =>
    asLines(
      (mine ? orders.mine : orders.theirs).filter((o) => o.order_id === id),
    ),
  wholeOrder: (id: number, mine: boolean) =>
    asLines(
      (mine ? orders.allMine : orders.allTheirs).filter(
        (o) => o.order_id === id,
      ),
    ),
  invoiceLines: (id: number, mine: boolean): DocLine[] =>
    (mine ? receipts.mine : receipts.theirs)
      .filter((r) => r.invoiceid === id)
      .flatMap((r) =>
        r.lines.map((l) => ({
          code: codeOf(l.product_code),
          description: l.product_description,
          // `qty` is the selling-unit count on a receiver line, the same
          // field the order side above reads. See the note in vitalsOf.
          units: l.item_return ? -l.qty : l.qty,
          cost: l.ext_cost,
        })),
      ),
});

/** Whether a document carries any of the wanted codes (every document does
 *  when none are asked for). */
export const matchesCodes =
  (wanted: Set<string>, lines: ReturnType<typeof documentLines>) =>
  (rec: SupplyRecord, isOrder: boolean) =>
    wanted.size === 0 ||
    (isOrder
      ? lines.orderLines(rec.id, rec.mine)
      : lines.invoiceLines(rec.id, rec.mine)
    ).some((l) => wanted.has(l.code));

/** Why an orders list is empty, when it is. The window-wide cases are the
 *  ones that say whether "never ordered" can be claimed at all. */
export const ordersNote = (
  row: SupplyRow,
  store: string,
  orders: OrdersWave,
  supply: Supply,
): string | null => {
  if (!orders.ok)
    return "The orders did not come back for this window, so this card cannot say whether either store ordered. What was received is read separately.";
  if (row.docs.length > 0)
    return `No order at ${store} carries any of those codes.`;
  if (supply.orders.length > 0) return null;
  return orders.inWindow === 0
    ? supply.deliveries.length > 0
      ? "No order of any kind came back for either store over the window, and receivers came in anyway, which is what a department delivered straight off the vendor's truck looks like. Nothing here can say an item was never ordered, so those items are listed as not carried instead."
      : "Neither store placed an order of any kind over the window. That is the finding, not a gap in the data."
    : `${orders.inWindow.toLocaleString("en-US")} order lines came back for these two stores over the window and none of them is in this department, by product code or by the department the order itself names. Nothing here can say an item was never ordered, so those items are listed as not carried instead.`;
};

/** One slide per Supply row: its tab label and count, the documents that
 *  match, its headline, the note for an empty list, and its foot line. */
export const supplySlides = (args: {
  rows: SupplyRow[];
  us: string;
  them: string;
  window: { start: string; end: string };
  supply: Supply;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  cash: (v: number) => string;
  matches: (rec: SupplyRecord, isOrder: boolean) => boolean;
}) => {
  const { rows, us, them, window, supply, orders, receipts, cash, matches } =
    args;
  return rows.map((row) => {
    const store = row.mine ? us : them;
    const shown = row.docs.filter((d) => matches(d, row.isOrder));
    const received = (row.mine ? supply.mine : supply.theirs).deliveries;
    const units = shown.reduce((t, d) => t + d.units, 0);
    const cost = shown.reduce((t, d) => t + d.cost, 0);
    const note =
      shown.length > 0
        ? null
        : row.isOrder
          ? ordersNote(row, store, orders, supply)
          : !receipts.ok
            ? null
            : row.docs.length > 0
              ? `No receiver at ${store} carries any of those codes.`
              : noReceiptsNote(store, window);
    return {
      row,
      label: supplyTab(row, us, them),
      count: row.docs.length,
      shown,
      says: supplySlideSays(row, store, received, orders.ok, receipts.ok, cash),
      note,
      foot: row.isOrder
        ? `${plural(shown.length, "order")} | ${countText(units)} units | newest first`
        : `${plural(shown.length, "receiver")} | ${countText(units)} units | ${cash(cost)} | newest first`,
    };
  });
};
