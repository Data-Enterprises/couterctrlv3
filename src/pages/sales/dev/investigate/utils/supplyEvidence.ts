// Utils
import { DEFAULT_BANDS } from "./deptInvestigation";
import { codeOf } from ".";

// Interfaces
import type { AllOrder, ReceiverItemSearchReceiver, SubsPricePoint } from "../../../../../interfaces";
import type { Bands, SupplyEvent, PriceLadder } from "../interfaces";

const day = (v: string) => (v ?? "").split("T")[0];

/**
 * What happened to one item, at one store, in date order.
 *
 * This is the evidence behind the cause. "Didn't arrive" is a label a reader
 * has to take on trust until they can see an order on the 22nd with nothing
 * against it — so the timeline is not a decoration, it is the proof.
 *
 * It states only what each source actually says. There is no "short"
 * event: deciding a delivery came up short would mean dividing receipt units
 * by order cases, and an order's case size is its own column for a reason.
 * Two orders and one receipt are shown as exactly that, and the reader can
 * see the gap without being told a number that might be wrong.
 */
export const supplyTimeline = (
  productCode: string,
  orders: AllOrder[],
  receivers: ReceiverItemSearchReceiver[],
): SupplyEvent[] => {
  const out: SupplyEvent[] = [];

  orders
    .filter((o) => codeOf(o.product_code) === productCode)
    .forEach((o) =>
      out.push({
        date: day(o.order_date),
        kind: "ordered",
        amount: o.qty,
        unit: "cases",
        detail: [o.status, o.vendor_name].filter(Boolean).join(" · "),
      }),
    );

  receivers.forEach((r) =>
    r.lines
      .filter((l) => codeOf(l.product_code) === productCode)
      .forEach((l) =>
        out.push({
          date: day(r.invoice_date),
          kind: "received",
          // `qty`, not `units` -- this is the line that had every RECEIVED
          // badge in the evidence rail reading "0 units" against invoices
          // that plainly delivered something.
          amount: l.qty,
          unit: "units",
          detail: [r.vendor_name, `inv ${r.invoiceid}`].filter(Boolean).join(" · "),
        }),
      ),
  );

  // Oldest first: the story reads forwards, and an order with nothing after
  // it is only obviously an order with nothing after it in that order.
  return out.sort((a, b) => a.date.localeCompare(b.date));
};

/* ------------------------------------------------------------------ */
/* True price points                                                   */
/* ------------------------------------------------------------------ */

export const ladderFor = (
  points: SubsPricePoint[],
  productCode: string,
  bands: Bands = DEFAULT_BANDS,
  weighted = false,
): PriceLadder => {
  const mine = points
    .filter((p) => codeOf(p.product_code) === productCode)
    .map((p) => ({
      price: p.price,
      units: p.units,
      weight: p.weight,
      transactions: p.transactions,
      netSales: p.net_sales,
      days: p.days,
      unitsPerBasket: p.transactions > 0 ? p.units / p.transactions : null,
    }))
    .sort((a, b) => b.units - a.units);

  const units = mine.reduce((a, p) => a + p.units, 0);
  const sales = mine.reduce((a, p) => a + p.netSales, 0);
  const txns = mine.reduce((a, p) => a + p.transactions, 0);

  const prices = mine.map((p) => p.price);
  const spread =
    prices.length > 1 ? Math.max(...prices) / Math.min(...prices) - 1 : 0;

  return {
    points: mine,
    modal: mine.length ? mine[0].price : null,
    blended: units > 0 ? sales / units : null,
    unitsPerBasket: txns > 0 ? units / txns : null,
    // A weighted item rings a different total on every package, so the
    // spread is always wide and would flag a promotion on every scale item in
    // the department. Only a per-unit price can carry that claim.
    promo: !weighted && mine.length > 1 && spread > bands.price,
    weighted,
  };
};
