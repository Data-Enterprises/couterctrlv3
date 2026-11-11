// Hooks
import { useMemo } from "react";

// Utils
import { netOf } from "../../../../utils/perfPairs";
import { formatCurrency2 } from "../../../../utils";
import {
  estimatedPricePoints,
  pricePointsFromServer,
  linesAtPrice,
  classifyPattern,
  suggestPrice,
  suggestionWithheld,
  type ActualPricePoint,
} from "../../../../utils/pricePoints";
import { ACT_COLS, dash, EST_COLS, itemCostStats, NO_ROWS } from "../utils";
import { resolveUnitCost } from "../utils/invoiceCost";

// Interfaces
import type { InvoiceCostState, ProductSummary } from "../interfaces";
import type { ActualFetchState } from "../../../../hooks/useActualPricePoints";
import type { PricePointsState } from "../../../../hooks/usePricePoints";

// Components
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/20/solid";
import ActualPriceRow from "./ActualPriceRow";

interface ItemAnalysisPanelProps {
  product: ProductSummary;
  /** The price table, for whichever item `prices.upc` names. */
  prices: PricePointsState;
  /** The item's receipt lines, read only once a price is opened. */
  receipts: ActualFetchState;
  onLoadReceipts: () => void;
  /** The latest invoice cost lookup for the item on screen. */
  invoice: InvoiceCostState;
}

/**
 * One item, read two ways, and only one gets a vote. Estimated (left) is from
 * daily roll-ups; actual (right) is `cashiers/price_points`, every receipt
 * line bucketed on the server. A price on the left with no counterpart on the
 * right never existed.
 *
 * The suggestion reads the **actual** side only: estimated divides a day's
 * dollars by its units, giving prices nobody was charged. The actual side
 * keeps its full height while it loads.
 */
const ItemAnalysisPanel = ({
  product,
  prices,
  receipts,
  onLoadReceipts,
  invoice,
}: ItemAnalysisPanelProps) => {
  // Only ever read when the fetch belongs to the item on screen. A response
  // for the previously-clicked UPC is dropped rather than rendered.
  const isCurrent = prices.upc === product.productCode;
  const rows = isCurrent ? prices.rows : NO_ROWS;
  /** Same staleness gate as the rows: counts for the last item must not
   *  be read against this one. */
  const mixed = isCurrent ? prices.mixed : null;
  // The panel's loading and error states are the price table's. The receipts
  // only ever load under an opened row, and say so there.
  const actual = prices;
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
  const pattern = useMemo(
    () => classifyPattern(act, mixed),
    [act, mixed],
  );
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

  const showPattern = isCurrent && !actual.loading && !actual.error;

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-[10px] bg-brand_navy">
          <div className="text-[14px] cc-navy-title leading-tight truncate">
            {product.description}
          </div>
          <div className="text-[11px] mt-0.5 text-custom-white truncate">
            {product.productCode}
          </div>
        </div>

        <div className="grid grid-cols-6 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[11px] cc-caps-strong">
              Sales
            </div>
            <div className="text-[15px] font-bold text-content tabular-nums mt-0.5">
              {formatCurrency2(totals.sales)}
            </div>
          </div>
          {/* The floor under every price on this screen. Without it a reader
              can see that $6.50 moves fastest but not that it's below cost. */}
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[11px] cc-caps-strong">
              Cost / unit
            </div>
            <div className="text-[15px] font-bold text-content tabular-nums mt-0.5">
              {totals.unitCost !== null
                ? formatCurrency2(totals.unitCost)
                : dash}
            </div>
            {/* Where the figure came from: the two sources can differ by a
                dollar a unit. */}
            <div className="text-[11px] text-content/95 leading-tight mt-0.5">
              {cost.source === "invoice" && cost.invoice
                ? `invoice ${cost.invoice.date.slice(5).replace("-", "/")}`
                : invoice.loading && invoice.upc === product.productCode
                  ? "checking invoices…"
                  : "item file"}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[11px] cc-caps-strong">
              Units
            </div>
            <div className="text-[15px] font-bold text-content tabular-nums mt-0.5">
              {totals.units % 1 === 0 ? totals.units : totals.units.toFixed(2)}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[11px] cc-caps-strong">
              GM%
            </div>
            <div
              className={`text-[15px] font-bold tabular-nums mt-0.5 ${
                totals.marginPct === null
                  ? "text-content"
                  : totals.marginPct < 0
                    ? "text-delta_negative_text"
                    : "text-delta_positive_text"
              }`}
            >
              {totals.marginPct !== null
                ? `${totals.marginPct.toFixed(2)}%`
                : dash}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[11px] cc-caps-strong">
              Prices
            </div>
            <div className="text-[15px] font-bold text-content tabular-nums mt-0.5">
              {totals.prices}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[11px] cc-caps-strong">
              Trans
            </div>
            <div className="text-[15px] font-bold text-content tabular-nums mt-0.5">
              {actual.loading && isCurrent ? (
                <span className="text-content/95">…</span>
              ) : (
                totals.trans
              )}
            </div>
          </div>
        </div>

        {/* The page's headline now that its job is optimisation. Sits above the
            pattern line because it's the answer; the pattern is the caveat. */}
        {withheld && (
          <div className="px-4 pt-3 flex-shrink-0">
            <div className="rounded-lg border border-line_field bg-fill_soft px-3 py-2 flex gap-2 items-start">
              <InformationCircleIcon className="w-4 h-4 text-content/95 flex-shrink-0 mt-px" />
              <p className="text-[13px] text-content leading-snug">{withheld}</p>
            </div>
          </div>
        )}

        {suggestion && (
          <div data-help="suggestion" className="px-4 pt-3 flex-shrink-0">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <ArrowTrendingUpIcon className="w-4 h-4 text-blue-800 flex-shrink-0" />
                <span className="text-[12px] font-semibold uppercase tracking-wide text-blue-900">
                  Moves fastest at
                </span>
                <span className="text-[16px] font-bold text-blue-900 tabular-nums">
                  {formatCurrency2(suggestion.best.point.price)}
                </span>
                <span className="text-[12px] text-blue-900">
                  {suggestion.best.point.priceType} ·{" "}
                  {suggestion.best.velocity.toFixed(1)}/day over{" "}
                  {suggestion.best.point.daysSeen}{" "}
                  {suggestion.best.point.daysSeen === 1 ? "day" : "days"} ·{" "}
                  {formatCurrency2(suggestion.best.point.marginPerUnit)}/unit at{" "}
                  {suggestion.best.point.marginPct.toFixed(1)}% GM
                </span>
                {/* A price can be the fastest mover and still lose money on
                    every unit. That has to outrank everything else on the row. */}
                {suggestion.best.point.marginPerUnit < 0 && (
                  <span className="text-[11px] px-1.5 py-px rounded bg-severity_critical_bg text-severity_critical_text font-medium">
                    Below cost
                  </span>
                )}
                {suggestion.isCurrent && (
                  <span className="text-[11px] px-1.5 py-px rounded bg-blue-100 text-blue-900 font-medium">
                    Already selling here
                  </span>
                )}
              </div>

              {suggestion.current && (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[12px] text-blue-900">
                  <span>
                    Now at{" "}
                    <span className="tabular-nums font-medium">
                      {formatCurrency2(suggestion.current.point.price)}
                    </span>{" "}
                    · {suggestion.current.velocity.toFixed(1)}/day ·{" "}
                    {suggestion.current.point.marginPct.toFixed(1)}% GM
                  </span>
                  {/* Selling faster and earning less is the case this whole
                      band exists to make visible. */}
                  <span
                    className={`px-1.5 py-px rounded font-medium ${
                      suggestion.profitDelta >= 0
                        ? "bg-delta_positive_bg text-delta_positive_text"
                        : "bg-delta_negative_bg text-delta_negative_text"
                    }`}
                  >
                    {suggestion.profitDelta >= 0 ? "+" : "−"}
                    {formatCurrency2(Math.abs(suggestion.profitDelta))}/day
                    profit
                  </span>
                </div>
              )}

              {suggestion.isCheapest && !suggestion.isCurrent && (
                <div className="mt-1.5 text-[11.5px] text-blue-900/95">
                  This is also the lowest price on record — volume at the
                  cheapest price is expected, not a finding.
                </div>
              )}
            </div>
          </div>
        )}

        {/* One verdict, not a stack — the checks are ordered so the most
            specific explanation wins. */}
        {showPattern && (
          <div className="px-4 pt-3 flex-shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg ${
                pattern.concerning ? "bg-severity_watch_bg" : "bg-fill_soft"
              }`}
            >
              {pattern.concerning ? (
                <ExclamationTriangleIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0" />
              ) : (
                <InformationCircleIcon className="w-4 h-4 text-content/95 flex-shrink-0" />
              )}
              <span
                className={`text-[12.5px] truncate ${pattern.concerning ? "text-severity_watch_text" : "text-content"}`}
              >
                <span className="font-medium">{pattern.title}</span> —{" "}
                {pattern.detail}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-line_hair overflow-hidden">
          {/* Estimated */}
          <div
            data-help="estimated"
            className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3"
          >
            <div className="flex items-baseline gap-2 mb-2">
              {/* Names the arithmetic (an average), so nobody quotes a figure
                from it. */}
              <span className="text-[12px] font-semibold text-content">
                Daily average
              </span>
              <span className="text-[11px] text-content/95">
                a day&rsquo;s sales &divide; its units
              </span>
            </div>
            <div
              className="grid px-1 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content border-b border-line_hair sticky top-0 bg-custom-white"
              style={{ gridTemplateColumns: EST_COLS }}
            >
              <span>Price</span>
              <span>Type</span>
              <span className="text-right">Qty</span>
              <span className="text-right">GM%</span>
              <span className="text-right">Days</span>
            </div>
            {estimated.map((p) => {
              return (
                <div
                  key={`${p.price}-${p.priceType}`}
                  className="grid px-1 py-2 text-[13px] border-b border-line_faint even:bg-row_stripe"
                  style={{ gridTemplateColumns: EST_COLS }}
                >
                  <span className="tabular-nums text-content">
                    {formatCurrency2(p.price)}
                  </span>
                  <span className="text-content/95">{p.priceType}</span>
                  <span className="text-right tabular-nums text-content">
                    {p.units % 1 === 0 ? p.units : p.units.toFixed(2)}
                  </span>
                  <span
                    className={`text-right tabular-nums font-medium ${p.marginPct < 0 ? "text-delta_negative_text" : "text-delta_positive_text"}`}
                  >
                    {p.marginPct.toFixed(1)}%
                  </span>
                  <span className="text-right tabular-nums text-content">
                    {p.daysSeen}
                  </span>
                </div>
              );
            })}
            {estimated.length === 0 && (
              <div className="py-6 text-center text-[12.5px] text-content/95">
                No sales rows in this window
              </div>
            )}
          </div>

          {/* Actual — holds its column whatever state it's in. */}
          <div
            data-help="actual"
            className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3"
          >
            <div className="flex items-baseline gap-2 mb-2">
              {/* Paired with "Daily average" so the two headers contrast on
                  the thing that matters: one is worked out, this one happened. */}
              <span className="text-[12px] font-semibold text-content">
                Actually charged
              </span>
              {isCurrent && !actual.loading && act.exactCount > 0 && (
                <span className="text-[11px] px-1.5 py-px rounded bg-blue-50 text-blue-800">
                  {act.isWeighted ? "$/lb" : "Exact"} · {act.exactCount} trans
                </span>
              )}
            </div>

            {actual.loading && isCurrent && (
              <div className="py-6 text-center text-[12.5px] text-content/95">
                Reading registers…
              </div>
            )}

            {isCurrent && actual.error && (
              <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-severity_watch_bg">
                <ExclamationTriangleIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0 mt-px" />
                <span className="text-[12.5px] text-severity_watch_text">
                  {actual.error}
                </span>
              </div>
            )}

            {isCurrent && !actual.loading && !actual.error && (
              <>
                {act.exact.length === 0 && act.averaged.length === 0 && (
                  <div className="py-6 text-center text-[12.5px] text-content/95">
                    No register lines matched this item
                  </div>
                )}

                {act.exact.length > 0 && (
                  <>
                    <div
                      className="grid px-1 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content border-b border-line_hair"
                      style={{ gridTemplateColumns: ACT_COLS }}
                    >
                      <span>{act.isWeighted ? "$/lb" : "Price"}</span>
                      <span>Type</span>
                      <span className="text-right">Trans</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">GM%</span>
                      <span className="text-right">Days</span>
                      <span className="text-right">Total</span>
                    </div>
                    {act.exact.map((p) => (
                      <ActualPriceRow
                        key={`e-${p.price}-${p.priceType}`}
                        point={p}
                        // The band names a price; this is that price in the
                        // table. Without the tie the reader has to scan for it.
                        isBest={p === suggestion?.best.point}
                        lines={linesFor(p, false)}
                        receiptsLoading={receiptsHere && receipts.loading}
                        receiptsError={receiptsHere ? receipts.error : null}
                        onOpen={onLoadReceipts}
                      />
                    ))}
                  </>
                )}

                {act.averaged.length > 0 && (
                  <>
                    <div className="mt-3 mb-1">
                      <span className="text-[11px] px-1.5 py-px rounded bg-fill_muted text-content">
                        Avg · {act.averagedCount} trans
                      </span>
                    </div>
                    <div
                      className="grid px-1 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content border-b border-line_hair"
                      style={{ gridTemplateColumns: ACT_COLS }}
                    >
                      <span>Price</span>
                      <span>Type</span>
                      <span className="text-right">Trans</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">GM%</span>
                      <span className="text-right">Days</span>
                      <span className="text-right">Total</span>
                    </div>
                    {/* Never highlighted: a multi-unit ring divided by its
                        quantity is derived, and the suggestion only names
                        prices customers were charged. */}
                    {act.averaged.map((p) => (
                      <ActualPriceRow
                        key={`a-${p.price}-${p.priceType}`}
                        point={p}
                        lines={linesFor(p, true)}
                        receiptsLoading={receiptsHere && receipts.loading}
                        receiptsError={receiptsHere ? receipts.error : null}
                        onOpen={onLoadReceipts}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemAnalysisPanel;
