import type { ReceiverItemSearchReceiver } from "../../../interfaces";
import { normalizeProductCode } from "../../../utils/productCode";
import {
  fetchReceiversByItem,
  toReceiptLineFromSearch,
} from "../../itemReport/dev/itemReportData";
import type { InventoryScope } from "./inventoryData";

/**
 * What the store actually paid for an item, off its invoices.
 *
 * Price Opt used the item-file cost carried on the sales rows, and the item
 * file goes stale: COKE 6PK read $4.91 there while the 10/16 Coke invoice says
 * $3.13 a unit, so a $3.33 sale was flagged "below cost" at -47% when it made
 * money (dev board review, findings O and W). Item Actions already reads
 * invoices and got $3.13; this uses the same search, so the two pages agree.
 *
 * Decided 2026-10-22: the invoice cost is what they paid, so it wins; the item
 * file is the fallback when there is no invoice to read.
 */

/** How far back to look for a delivery. Same as Item Actions' default. */
export const INVOICE_LOOKBACK_DAYS = 90;
/** One item rarely has more than a handful of deliveries in 90 days. */
const MAX_RECEIVERS = 50;

export interface InvoiceCost {
  /** Per selling unit — the same unit the sales rows count in. */
  unitCost: number;
  /** yyyy-mm-dd of the invoice it came from. */
  date: string;
  invoiceId: string | number;
}

/**
 * The most recent invoiced cost for one UPC, on or before `asOf`.
 *
 * `ucost` is the paid unit cost on the day the line landed, whatever free or
 * returned quantity rides on the same line, so those are not filtered out.
 * A delivery after the window is skipped, because it can't be the cost of
 * anything sold inside it.
 */
export const latestInvoiceCost = (
  receivers: ReceiverItemSearchReceiver[],
  upc: string,
  asOf: string,
): InvoiceCost | null => {
  const want = normalizeProductCode(upc);
  const lines = receivers
    .flatMap((rec) => rec.lines.map((line) => toReceiptLineFromSearch(rec, line)))
    .filter(
      (l) =>
        l.productCode === want &&
        l.unitCost > 0 &&
        l.date.slice(0, 10) <= asOf,
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  const top = lines[0];
  return top
    ? { unitCost: top.unitCost, date: top.date.slice(0, 10), invoiceId: top.invoiceId }
    : null;
};

export const fetchInvoiceCost = async (
  scope: InventoryScope,
  upc: string,
): Promise<InvoiceCost | null> => {
  const { receivers } = await fetchReceiversByItem(
    scope,
    [upc],
    INVOICE_LOOKBACK_DAYS,
    MAX_RECEIVERS,
  );
  return latestInvoiceCost(receivers, upc, scope.end);
};

export type CostSource = "invoice" | "item file";

export interface ResolvedCost {
  unitCost: number | null;
  source: CostSource;
  /** Set when `source` is "invoice". */
  invoice: InvoiceCost | null;
}

/**
 * Which cost the page shows, and says where it came from.
 *
 * Invoice first. A weighed item stays on the item file: its sales are counted
 * in pounds, and an invoice line can be billed per case or per pack, so
 * holding one against the other would be the per-pound vs per-pack mix-up
 * this review already found once (finding A).
 */
export const resolveUnitCost = (
  itemFileUnitCost: number | null,
  invoice: InvoiceCost | null,
  weighed: boolean,
): ResolvedCost =>
  invoice && !weighed
    ? { unitCost: invoice.unitCost, source: "invoice", invoice }
    : { unitCost: itemFileUnitCost, source: "item file", invoice: null };
