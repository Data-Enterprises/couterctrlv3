// Hooks
import { useMemo } from "react";

// Utils
import { netOf } from "../../../../../utils/perfPairs";
import {
  estimatedPricePoints,
  pricePointsFromServer,
  linesAtPrice,
  classifyPattern,
  suggestPrice,
  suggestionWithheld,
  type ActualPricePoint,
} from "../../../../../utils/pricePoints";
import { itemCostStats, NO_ROWS } from "../../utils";
import { resolveUnitCost } from "../../utils/invoiceCost";

// Interfaces
import type { InvoiceCostState, ProductSummary } from "../../interfaces";
import type { ActualFetchState } from "../../../../../hooks/useActualPricePoints";
import type { PricePointsState } from "../../../../../hooks/usePricePoints";

/**
 * One item's analysis: the unit cost and where it came from, both price
 * tables, the pattern and the suggestion (from the actual side only), the
 * strip's totals, and the receipts behind any one price.
 */
export const useItemAnalysis = (
  product: ProductSummary,
  prices: PricePointsState,
  receipts: ActualFetchState,
  invoice: InvoiceCostState,
) => {
  // Only ever read when the fetch belongs to the item on screen. A response
  // for the previously-clicked UPC is dropped rather than rendered.
  const isCurrent = prices.upc === product.productCode;
  const rows = isCurrent ? prices.rows : NO_ROWS;
  /** Same staleness gate as the rows: counts for the last item must not
   *  be read against this one. */
  const mixed = isCurrent ? prices.mixed : null;
  const receiptsHere = receipts.upc === product.productCode;

  // Register lines carry no cost, so one unit cost reaches them: the latest
  // invoice cost, else the item-file cost from `subs/subs`. Held once, so no
  // two margins on screen disagree.
  const itemFile = useMemo(() => itemCostStats(product), [product]);
  const weighed = useMemo(
    () => product.rows.some((r) => r.weight > 0),
    [product.rows],
  );
  const invoiceForThis =
    invoice.upc === product.productCode ? invoice.cost : null;
  const cost = useMemo(
    () => resolveUnitCost(itemFile.unitCost, invoiceForThis, weighed),
    [itemFile.unitCost, invoiceForThis, weighed],
  );
  const override = cost.source === "invoice" ? cost.unitCost : null;
  const stats = useMemo(
    () => itemCostStats(product, override),
    [product, override],
  );
  const unitCost = stats.unitCost ?? 0;
  const estimated = useMemo(
    () => estimatedPricePoints(product.rows, override),
    [product.rows, override],
  );

  const act = useMemo(
    () => pricePointsFromServer(rows, unitCost),
    [rows, unitCost],
  );
  // "Package deal" is judged from the server's count of receipts reading the
  // item at two prices; null on a weighed item or an older API (no note).
  const pattern = useMemo(() => classifyPattern(act, mixed), [act, mixed]);
  // Weighed items have per-pound prices on both sides, so they get a suggestion too.
  const suggestion = useMemo(() => suggestPrice(act), [act]);
  const withheld = suggestionWithheld(act);

  /** The receipts behind one price, or null until they have been read. */
  const linesFor = (p: ActualPricePoint, averaged: boolean) =>
    receiptsHere && !receipts.loading && !receipts.error
      ? linesAtPrice(receipts.lines, p, { weighed: act.isWeighted, averaged })
      : null;

  const totals = useMemo(
    () => ({
      sales: product.rows.reduce((s, r) => s + netOf(r), 0),
      units: product.units,
      marginPct: stats.marginPct,
      unitCost: stats.unitCost,
      // One count, shared with the pattern note under it.
      prices: act.priceCount,
      // Receipts, once each, even when one sits in both tables.
      trans: act.receiptCount,
    }),
    [product, stats, act],
  );

  return {
    isCurrent,
    receiptsHere,
    cost,
    estimated,
    act,
    pattern,
    suggestion,
    withheld,
    linesFor,
    totals,
  };
};
