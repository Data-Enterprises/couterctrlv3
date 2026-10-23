import { netOf } from "../../../utils/perfPairs";
import { useMemo } from "react";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../utils";
import {
  estimatedPricePoints,
  pricePointsFromServer,
  linesAtPrice,
  classifyPattern,
  suggestPrice,
  suggestionWithheld,
  type ActualPricePoint,
} from "../../../utils/pricePoints";
import ActualPriceRow, { ACT_COLS } from "./ActualPriceRow";
import { itemCostStats, type ProductSummary } from "./inventoryData";
import type { ActualFetchState } from "../../../hooks/useActualPricePoints";
import type { PricePointsState } from "../../../hooks/usePricePoints";
import { resolveUnitCost } from "./invoiceCost";
import type { InvoiceCostState } from "./useInvoiceCost";

/**
 * One item, read two ways — and only one of them gets a vote.
 *
 * Estimated on the left from daily roll-ups already in hand, actual on the
 * right from `cashiers/price_points`, which buckets every receipt line on the
 * server. The two tables share their first two columns so a reader's eye can
 * run across, and the gap between them is the finding: a price on the left
 * with no counterpart on the right never existed.
 *
 * The suggestion reads the **actual** side only. Estimated divides a day's
 * dollars by a day's units, so nineteen rings at $13.99 and one at $12.99
 * produce a $13.88 that nobody was ever charged — fine as an observation,
 * disqualifying as a recommendation.
 *
 * The actual side keeps its full height while it loads. It arrives seconds
 * after the estimated side, and a panel that grows underneath the reader is
 * worse than one that starts the right size.
 *
 * Shared with the forthcoming Vendor page unchanged — only the tree that
 * chooses the item differs between them.
 */

interface Props {
  product: ProductSummary;
  /** The price table, for whichever item `prices.upc` names. */
  prices: PricePointsState;
  /** The item's receipt lines, read only once a price is opened. */
  receipts: ActualFetchState;
  onLoadReceipts: () => void;
  /** The latest invoice cost lookup for the item on screen. */
  invoice: InvoiceCostState;
}

const EST_COLS = "1fr 46px 42px 52px 34px";
const NO_ROWS: PricePointsState["rows"] = [];
const dash = "—";

const ItemAnalysisPanel = ({
  product,
  prices,
  receipts,
  onLoadReceipts,
  invoice,
}: Props) => {
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

  // Register lines carry no cost, so a unit cost has to reach them before any
  // actual-side margin can exist. The latest invoice cost when there is one,
  // the item-file cost off the `subs/subs` rows otherwise -- one figure, held
  // under both tables and the header, so no two margins on screen disagree.
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
  // "Package deal" reads each receipt for the item at two prices. The server
  // reports that count now (finding D), so the pattern is judged from it
  // rather than from a download of every receipt. Null on a weighed item or
  // an older API, and the pattern then stays quiet.
  const pattern = useMemo(
    () => classifyPattern(act, mixed),
    [act, mixed],
  );
  // Weighed items have per-pound prices on both sides now, so the notice that
  // withheld their suggestion (finding A's stop-gap) is gone.
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
      // One count, shared with the pattern note under it. These were computed
      // separately and disagreed on screen — 5 here against "4 prices across
      // 84 transactions" below (finding AT).
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
          <div className="text-[13px] font-semibold text-custom-white leading-tight truncate">
            {product.description}
          </div>
          <div className="text-[10px] mt-0.5 text-custom-white truncate">
            {product.productCode}
          </div>
        </div>

        <div className="grid grid-cols-6 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Sales
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {formatCurrency2(totals.sales)}
            </div>
          </div>
          {/* The floor under every price on this screen. Without it a reader
              can see that $6.50 moves fastest but not that it's below cost. */}
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Cost / unit
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {totals.unitCost !== null
                ? formatCurrency2(totals.unitCost)
                : dash}
            </div>
            {/* Where the figure came from, because the two sources can differ
                by a dollar a unit and a reader checking an invoice needs to
                know which one this is. */}
            <div className="text-[10px] text-content/70 leading-tight mt-0.5">
              {cost.source === "invoice" && cost.invoice
                ? `invoice ${cost.invoice.date.slice(5).replace("-", "/")}`
                : invoice.loading && invoice.upc === product.productCode
                  ? "checking invoices…"
                  : "item file"}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Units
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {totals.units % 1 === 0 ? totals.units : totals.units.toFixed(2)}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              GM%
            </div>
            <div
              className={`text-[14px] font-bold tabular-nums mt-0.5 ${
                totals.marginPct === null
                  ? "text-content"
                  : totals.marginPct < 0
                    ? "text-red-800"
                    : "text-emerald-800"
              }`}
            >
              {totals.marginPct !== null
                ? `${totals.marginPct.toFixed(2)}%`
                : dash}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Prices
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {totals.prices}
            </div>
          </div>
          <div className="px-3 pt-2.5 pb-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-content">
              Trans
            </div>
            <div className="text-[14px] font-bold text-content tabular-nums mt-0.5">
              {actual.loading && isCurrent ? (
                <span className="text-gray-400">…</span>
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
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 flex gap-2 items-start">
              <InformationCircleIcon className="w-4 h-4 text-content/60 flex-shrink-0 mt-px" />
              <p className="text-[12px] text-content leading-snug">{withheld}</p>
            </div>
          </div>
        )}

        {suggestion && (
          <div data-help="suggestion" className="px-4 pt-3 flex-shrink-0">
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <ArrowTrendingUpIcon className="w-4 h-4 text-blue-800 flex-shrink-0" />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-900">
                  Moves fastest at
                </span>
                <span className="text-[15px] font-bold text-blue-900 tabular-nums">
                  {formatCurrency2(suggestion.best.point.price)}
                </span>
                <span className="text-[11px] text-blue-900">
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
                  <span className="text-[10px] px-1.5 py-px rounded bg-red-100 text-red-900 font-medium">
                    Below cost
                  </span>
                )}
                {suggestion.isCurrent && (
                  <span className="text-[10px] px-1.5 py-px rounded bg-blue-100 text-blue-900 font-medium">
                    Already selling here
                  </span>
                )}
              </div>

              {suggestion.current && (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] text-blue-900">
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
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-red-100 text-red-900"
                    }`}
                  >
                    {suggestion.profitDelta >= 0 ? "+" : "−"}
                    {formatCurrency2(Math.abs(suggestion.profitDelta))}/day
                    profit
                  </span>
                </div>
              )}

              {suggestion.isCheapest && !suggestion.isCurrent && (
                <div className="mt-1.5 text-[10.5px] text-blue-900/85">
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
                pattern.concerning ? "bg-amber-50" : "bg-gray-50"
              }`}
            >
              {pattern.concerning ? (
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-800 flex-shrink-0" />
              ) : (
                <InformationCircleIcon className="w-4 h-4 text-content/60 flex-shrink-0" />
              )}
              <span
                className={`text-[11.5px] truncate ${pattern.concerning ? "text-amber-900" : "text-content"}`}
              >
                <span className="font-medium">{pattern.title}</span> —{" "}
                {pattern.detail}
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 grid grid-cols-2 divide-x divide-gray-100 overflow-hidden">
          {/* Estimated */}
          <div
            data-help="estimated"
            className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3"
          >
            <div className="flex items-baseline gap-2 mb-2">
              {/* "Estimated" read as approximate-but-right, which is the one
                  thing this side is not. Naming the arithmetic is the warning:
                  a reader who knows it is an average already knows not to
                  quote a figure from it. */}
              <span className="text-[11px] font-semibold text-content">
                Daily average
              </span>
              <span className="text-[10px] text-content/60">
                a day&rsquo;s sales &divide; its units
              </span>
            </div>
            <div
              className="grid px-1 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100 sticky top-0 bg-custom-white"
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
                  className="grid px-1 py-2 text-[12px] border-b border-gray-50 even:bg-row_stripe"
                  style={{ gridTemplateColumns: EST_COLS }}
                >
                  <span className="tabular-nums text-content">
                    {formatCurrency2(p.price)}
                  </span>
                  <span className="text-content/70">{p.priceType}</span>
                  <span className="text-right tabular-nums text-content">
                    {p.units % 1 === 0 ? p.units : p.units.toFixed(2)}
                  </span>
                  <span
                    className={`text-right tabular-nums font-medium ${p.marginPct < 0 ? "text-red-700" : "text-emerald-700"}`}
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
              <div className="py-6 text-center text-[11.5px] text-content/60">
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
              <span className="text-[11px] font-semibold text-content">
                Actually charged
              </span>
              {isCurrent && !actual.loading && act.exactCount > 0 && (
                <span className="text-[10px] px-1.5 py-px rounded bg-blue-50 text-blue-800">
                  {act.isWeighted ? "$/lb" : "Exact"} · {act.exactCount} trans
                </span>
              )}
            </div>

            {actual.loading && isCurrent && (
              <div className="py-6 text-center text-[11.5px] text-content/60">
                Reading registers…
              </div>
            )}

            {isCurrent && actual.error && (
              <div className="flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-amber-50">
                <ExclamationTriangleIcon className="w-4 h-4 text-amber-800 flex-shrink-0 mt-px" />
                <span className="text-[11.5px] text-amber-900">
                  {actual.error}
                </span>
              </div>
            )}

            {isCurrent && !actual.loading && !actual.error && (
              <>
                {act.exact.length === 0 && act.averaged.length === 0 && (
                  <div className="py-6 text-center text-[11.5px] text-content/60">
                    No register lines matched this item
                  </div>
                )}

                {act.exact.length > 0 && (
                  <>
                    <div
                      className="grid px-1 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100"
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
                      <span className="text-[10px] px-1.5 py-px rounded bg-gray-100 text-content">
                        Avg · {act.averagedCount} trans
                      </span>
                    </div>
                    <div
                      className="grid px-1 py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100"
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
                    {/* Never highlighted, whatever it sells — a multi-unit ring
                        divided by its quantity is a derived figure, and the
                        suggestion only names prices customers were charged. */}
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
