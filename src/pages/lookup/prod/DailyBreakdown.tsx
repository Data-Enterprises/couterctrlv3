import { formatCurrency2 } from "../../../utils";
import type { DayBucket } from "./lookupMetrics";
import { dayMarginPct, dayUnitCost, formatUnits } from "./lookupMetrics";

interface DailyBreakdownProps {
  buckets: DayBucket[];
  /** Scale item: pounds show beside the ring count. */
  weighed: boolean;
  /** "Sale", or the non-Sale type these buckets are a timeline of. Cost and
   *  margin only mean something for Sale, so the other types drop them. */
  saleType?: string;
}

/**
 * The item's last 14 days, inline on the result screen.
 *
 * Was a BottomSheet behind a "View breakdown" button. Fourteen rows is small
 * enough to just show, and the totals above it say everything the summary
 * cards it replaced were saying — so the tap, the button and the overlay all
 * went away together.
 *
 * A scale item shows qty and weight side by side: qty is how many times it
 * rang, weight is what it was priced and costed by, and neither stands in for
 * the other.
 */
const DailyBreakdown = ({ buckets, weighed, saleType = "Sale" }: DailyBreakdownProps) => {
  const isSale = saleType === "Sale";
  const totalQty = buckets.reduce((acc, b) => acc + b.qty, 0);
  const totalUnits = buckets.reduce((acc, b) => acc + b.units, 0);
  const totalRevenue = buckets.reduce((acc, b) => acc + b.revenue, 0);
  const totalCost = buckets.reduce((acc, b) => acc + b.cost, 0);
  // No cost on file costs out at $0 — a 100% margin nobody earned.
  const costMissing = totalRevenue > 0 && totalCost <= 0;
  const totalMarginPct =
    totalRevenue > 0 && !costMissing
      ? ((totalRevenue - totalCost) / totalRevenue) * 100
      : null;

  // Date, Qty, [Lb], Amount, then Cost + Margin on Sale or List price otherwise.
  const cols = 1 + 1 + (weighed ? 1 : 0) + 1 + (isSale ? 2 : 1);
  const grid = { gridTemplateColumns: `1.1fr repeat(${cols - 1}, 1fr)` };
  const muted = (b: DayBucket) => (b.hasSale ? "text-content" : "text-content/85");

  const tile = (label: string, value: string, sub?: string, danger = false) => (
    <div className="px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
        {label}
      </div>
      <div
        className={`text-[12px] font-semibold mt-0.5 tabular-nums ${danger ? "text-red-800" : "text-content"}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[10.5px] text-content/85 tabular-nums">{sub}</div>
      )}
    </div>
  );

  return (
    <div className="border-t border-gray-100">
      {/* Amount / Qty / COGS / Margin — the same figures the desktop report
          totals on, so a phone and a desk agree on the summary. */}
      <div
        className={`grid ${isSale ? "grid-cols-4" : "grid-cols-2"} divide-x divide-gray-100 border-b border-[#1e2a4a]/15 flex-shrink-0 bg-custom-white`}
      >
        {tile("Amount", formatCurrency2(totalRevenue))}
        {tile(
          "Qty",
          totalQty.toLocaleString(),
          weighed ? formatUnits(totalUnits, true) : undefined,
        )}
        {isSale && tile("COGS", costMissing ? "No cost" : formatCurrency2(totalCost))}
        {isSale &&
          tile(
            "Margin",
            costMissing
              ? "No cost"
              : totalMarginPct !== null
                ? `${totalMarginPct.toFixed(2)}%`
                : "-",
            undefined,
            totalMarginPct !== null && totalMarginPct < 0,
          )}
      </div>

      <div
        className="grid px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content/85 border-b border-[#1e2a4a]/15"
        style={grid}
      >
        <span>Date</span>
        <span className="text-right">Qty</span>
        {weighed && <span className="text-right">Lb</span>}
        <span className="text-right">Amount</span>
        {isSale ? (
          <>
            <span className="text-right">{weighed ? "Cost/lb" : "U Cost"}</span>
            <span className="text-right">Margin</span>
          </>
        ) : (
          <span className="text-right">List</span>
        )}
      </div>

      <div
        className="overflow-y-auto thin-scrollbar"
        style={{ maxHeight: "50vh" }}
      >
        {[...buckets].reverse().map((b) => {
          const pct = dayMarginPct(b);
          const isNegative = pct !== null && pct < 0;
          const unitCost = dayUnitCost(b);
          return (
            <div
              key={b.date}
              className={`grid px-4 py-2 text-[12px] border-b border-[#1e2a4a]/15 even:bg-row_stripe ${
                b.hasSale ? "" : "text-content/85"
              }`}
              style={grid}
            >
              <span className={muted(b)}>{b.label}</span>
              <span className={`text-right tabular-nums ${muted(b)}`}>
                {b.hasSale ? b.qty.toLocaleString() : "—"}
              </span>
              {weighed && (
                // Pounds without the "lb" — the header already names the unit.
                <span className={`text-right tabular-nums ${muted(b)}`}>
                  {b.hasSale ? b.units.toFixed(2) : "—"}
                </span>
              )}
              <span className={`text-right tabular-nums ${muted(b)}`}>
                {b.hasSale ? formatCurrency2(b.revenue) : "—"}
              </span>
              {isSale ? (
                <>
                  <span className={`text-right tabular-nums font-medium ${muted(b)}`}>
                    {unitCost !== null
                      ? formatCurrency2(unitCost)
                      : b.hasSale
                        ? "No cost"
                        : "—"}
                  </span>
                  <span
                    className={`text-right tabular-nums font-medium ${
                      !b.hasSale
                        ? "text-content/85"
                        : isNegative
                          ? "text-red-700"
                          : "text-emerald-700"
                    }`}
                  >
                    {pct !== null ? `${pct.toFixed(2)}%` : "—"}
                  </span>
                </>
              ) : (
                <span className={`text-right tabular-nums ${muted(b)}`}>
                  {b.hasSale ? formatCurrency2(b.listPrice) : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyBreakdown;
