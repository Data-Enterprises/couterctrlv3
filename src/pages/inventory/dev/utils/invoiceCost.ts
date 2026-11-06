// Utils
import { normalizeProductCode } from "../../../../utils/productCode";
import {
  fetchReceiversByItem,
  toReceiptLineFromSearch,
} from "../../../../utils/receivers";

// Interfaces
import type { InvoiceCost, ResolvedCost, InventoryScope } from "../interfaces";
import type { ReceiverItemSearchReceiver } from "../../../../interfaces";

/**
 * What the store actually paid for an item, off its invoices (the item file
 * goes stale: COKE 6PK read $4.91 against a $3.13 invoice). The same search as
 * Item Actions, so the two agree. Invoice cost wins; the item file is the
 * fallback (decided 2026-10-22).
 */

/** How far back to look for a delivery. Same as Item Actions' default. */
export const INVOICE_LOOKBACK_DAYS = 90;
/** One item rarely has more than a handful of deliveries in 90 days. */
const MAX_RECEIVERS = 50;

/**
 * The most recent invoiced cost for one UPC, on or before `asOf`. `ucost` is
 * the paid unit cost whatever free or returned quantity rides on the line; a
 * delivery after the window is skipped.
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

/**
 * Which cost the page shows, and where it came from: invoice first, except a
 * weighed item stays on the item file (sold in pounds; invoices can bill per
 * case or pack).
 */
export const resolveUnitCost = (
  itemFileUnitCost: number | null,
  invoice: InvoiceCost | null,
  weighed: boolean,
): ResolvedCost =>
  invoice && !weighed
    ? { unitCost: invoice.unitCost, source: "invoice", invoice }
    : { unitCost: itemFileUnitCost, source: "item file", invoice: null };
