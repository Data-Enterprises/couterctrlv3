import { useMemo } from "react";
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../utils";
import {
  estimatedPricePoints,
  actualPricePoints,
  mixedPriceInsight,
  classifyPattern,
  suggestPrice,
} from "./pricePoints";
import ActualPriceRow, { ACT_COLS } from "./ActualPriceRow";
import { itemCostStats, type ProductSummary } from "./inventoryData";
import type { ActualFetchState } from "./useActualPricePoints";

/**
 * One item, read two ways — and only one of them gets a vote.
 *
 * Estimated on the left from daily roll-ups already in hand, actual on the
 * right from register lines fetched behind it. The two tables share their first
 * two columns so a reader's eye can run across, and the gap between them is the
 * finding: a price on the left with no counterpart on the right never existed.
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
  actual: ActualFetchState;
}

const EST_COLS = "1fr 46px 42px 52px 34px";
const dash = "—";

const ItemAnalysisPanel = ({ product, actual }: Props) => {
  const estimated = useMemo(
    () => estimatedPricePoints(product.rows),
    [product.rows],
  );

  // Only ever read when the fetch belongs to the item on screen. A response
  // for the previously-clicked UPC is dropped rather than rendered.
  const isCurrent = actual.upc === product.productCode;
  const lines = isCurrent ? actual.lines : [];

  // Register lines carry no cost, so the item's blended unit cost has to reach
  // them from the `subs/subs` rows before any actual-side margin can exist.
  // Shared with the export, which has to hold prices against the same floor.
  const stats = useMemo(() => itemCostStats(product), [product]);
  const unitCost = stats.unitCost ?? 0;

  const act = useMemo(
    () => actualPricePoints(lines, unitCost),
    [lines, unitCost],
  );
  const mixed = useMemo(() => mixedPriceInsight(lines), [lines]);
  const pattern = useMemo(() => classifyPattern(act, mixed), [act, mixed]);
  const suggestion = useMemo(() => suggestPrice(act), [act]);

  const totals = useMemo(
    () => ({
      sales: product.rows.reduce((s, r) => s + r.total_sales, 0),
      units: product.units,
      marginPct: stats.marginPct,
      unitCost: stats.unitCost,
      // Counts prices actually rung, not inferred ones — the tile has to agree
      // with the table the suggestion comes from.
      prices: act.exact.length + act.averaged.length,
      trans: act.exactCount + act.averagedCount,
    }),
    [product, stats, act],
  );

  const showPattern = isCurrent && !actual.loading && !actual.error;

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-[10px] bg-[#1e2a4a]">
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
        {suggestion && (
          <div className="px-4 pt-3 flex-shrink-0">
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
          <div className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[11px] font-semibold text-content">
                Estimated
              </span>
              <span className="text-[10px] text-content/60">
                daily roll-ups
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
          <div className="min-h-0 overflow-y-auto thin-scrollbar px-4 py-3">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[11px] font-semibold text-content">
                Actual
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
                      />
                    ))}
                  </>
                )}

                {actual.truncated > 0 && (
                  <div className="mt-3 text-[10px] text-content/60">
                    {actual.truncated} further receipts not read — this item
                    exceeds the per-search cap.
                  </div>
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
