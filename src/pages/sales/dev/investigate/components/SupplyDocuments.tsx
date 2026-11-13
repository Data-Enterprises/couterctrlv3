// Utils
import { codeOf } from "../utils";
import {
  SUPPLY_ORDER,
  noReceiptsNote,
  supplySlideSays,
  supplyTab,
} from "../utils/supplyRows";

// Interfaces
import type { OrdersWave, ReceiptsWave } from "../utils/investigationData";
import type { Supply, SupplyRecord } from "../utils/investigationSteps";
import type { AllOrder } from "../../../../../interfaces";
import type { DocLine, SupplyKind, SupplyRow } from "../interfaces";

// Components
import Carousel from "./Carousel";
import SupplySlide from "./SupplySlide";
import UpcFilter from "./UpcFilter";

interface SupplyDocumentsProps {
  supply: Supply;
  rows: SupplyRow[];
  /** The two stores' numbers, as the rows and tabs print them. */
  us: string;
  them: string;
  window: { start: string; end: string };
  cash: (v: number) => string;
  orders: OrdersWave;
  receipts: ReceiptsWave;
  /** UPCs carried over from the grid, comma or space separated. */
  upcQuery: string;
  onUpcQuery: (v: string) => void;
  selected: SupplyKind;
  onSelect: (kind: SupplyKind) => void;
}

/** The Supply tab's documents card: one slide per row, on the row picked
 *  beside it, every list narrowed by the pasted UPCs. Its own tabs pick the
 *  row back, so the two cards always agree. */
const SupplyDocuments = ({
  supply,
  rows,
  us,
  them,
  window,
  cash,
  orders,
  receipts,
  upcQuery,
  onUpcQuery,
  selected,
  onSelect,
}: SupplyDocumentsProps) => {
  /* The codes the reader is asking about, if any. Commas, spaces or new
     lines, because all three are what a paste brings with it. */
  const wanted = new Set(
    upcQuery
      .split(/[\s,]+/)
      .map((x) => x.trim())
      .filter(Boolean),
  );

  const asLines = (rows: AllOrder[]): DocLine[] =>
    rows.map((o) => ({
      code: codeOf(o.product_code),
      description: o.description,
      units: o.qty,
      cost: 0,
    }));

  /** An order's lines in this department. */
  const orderLines = (id: number, mine: boolean) =>
    asLines(
      (mine ? orders.mine : orders.theirs).filter((o) => o.order_id === id),
    );

  /** And the same order entire, which came down with the same request. */
  const wholeOrder = (id: number, mine: boolean) =>
    asLines(
      (mine ? orders.allMine : orders.allTheirs).filter(
        (o) => o.order_id === id,
      ),
    );

  const invoiceLines = (id: number, mine: boolean) =>
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
      );

  /* A document matches when any of its lines carries a code asked for. */
  const matches = (rec: SupplyRecord, isOrder: boolean) =>
    wanted.size === 0 ||
    (isOrder
      ? orderLines(rec.id, rec.mine)
      : invoiceLines(rec.id, rec.mine)
    ).some((l) => wanted.has(l.code));

  const shownOrders = supply.orders.filter((r) => matches(r, true));
  const shownDeliveries = supply.deliveries.filter((r) => matches(r, false));
  const n = (v: number) => Math.round(v).toLocaleString("en-US");
  const plural = (k: number, one: string) => `${n(k)} ${one}${k === 1 ? "" : "s"}`;

  /** Why an orders list is empty, when it is. The window-wide cases are the
   *  ones that say whether "never ordered" can be claimed at all. */
  const ordersNote = (row: SupplyRow, store: string): string | null => {
    if (!orders.ok)
      return "The orders did not come back for this window, so this card cannot say whether either store ordered. What was received is read separately.";
    if (row.docs.length > 0) return `No order at ${store} carries any of those codes.`;
    if (supply.orders.length > 0) return null;
    return orders.inWindow === 0
      ? supply.deliveries.length > 0
        ? "No order of any kind came back for either store over the window, and receivers came in anyway, which is what a department delivered straight off the vendor's truck looks like. Nothing here can say an item was never ordered, so those items are listed as not carried instead."
        : "Neither store placed an order of any kind over the window. That is the finding, not a gap in the data."
      : `${orders.inWindow.toLocaleString("en-US")} order lines came back for these two stores over the window and none of them is in this department, by product code or by the department the order itself names. Nothing here can say an item was never ordered, so those items are listed as not carried instead.`;
  };

  const slides = rows.map((row) => {
    const store = row.mine ? us : them;
    const shown = row.docs.filter((d) => matches(d, row.isOrder));
    const received = (row.mine ? supply.mine : supply.theirs).deliveries;
    const units = shown.reduce((t, d) => t + d.units, 0);
    const cost = shown.reduce((t, d) => t + d.cost, 0);
    const note =
      shown.length > 0
        ? null
        : row.isOrder
          ? ordersNote(row, store)
          : !receipts.ok
            ? null
            : row.docs.length > 0
              ? `No receiver at ${store} carries any of those codes.`
              : noReceiptsNote(store, window);
    return {
      label: supplyTab(row, us, them),
      count: row.docs.length,
      body: (
        <SupplySlide
          row={row}
          shown={shown}
          says={supplySlideSays(row, store, received, orders.ok, receipts.ok, cash)}
          note={note}
          warn={row.isOrder && !orders.ok}
          foot={
            row.isOrder
              ? `${plural(shown.length, "order")} | ${n(units)} units | newest first`
              : `${plural(shown.length, "receiver")} | ${n(units)} units | ${cash(cost)} | newest first`
          }
          linesOf={(r) => (row.isOrder ? orderLines(r.id, r.mine) : invoiceLines(r.id, r.mine))}
          /* The receipt search asks for the matched lines only, so an
             invoice has no "whole document" to offer. */
          wholeOf={(r) => (row.isOrder ? wholeOrder(r.id, r.mine) : null)}
          cash={cash}
        />
      ),
    };
  });

  return (
    <Carousel
      fill
      helpAnchor="supply-docs"
      at={SUPPLY_ORDER.indexOf(selected)}
      onAt={(i) => onSelect(SUPPLY_ORDER[i])}
      above={
        <UpcFilter
          value={upcQuery}
          onChange={onUpcQuery}
          codes={wanted.size}
          summary={`${plural(wanted.size, "code")} | ${shownOrders.length} of ${plural(supply.orders.length, "order")} and ${shownDeliveries.length} of ${plural(supply.deliveries.length, "receiver")} carry them.`}
        />
      }
      slides={slides}
    />
  );
};

export default SupplyDocuments;
