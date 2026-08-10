import { formatCurrency2 } from "../../../utils";
import type { DayBucket } from "./lookupMetrics";

interface DailyBreakdownProps {
  buckets: DayBucket[];
}

const dayMarginPct = (b: DayBucket): number | null =>
  b.hasSale && b.revenue > 0 ? ((b.revenue - b.cost) / b.revenue) * 100 : null;

/**
 * The item's last 14 days, inline on the result screen.
 *
 * Was a BottomSheet behind a "View breakdown" button. Fourteen rows is small
 * enough to just show, and the totals above it say everything the summary
 * cards it replaced were saying — so the tap, the button and the overlay all
 * went away together.
 */
const DailyBreakdown = ({ buckets }: DailyBreakdownProps) => {
  const totalQty = buckets.reduce((acc, b) => acc + b.qty, 0);
  const totalRevenue = buckets.reduce((acc, b) => acc + b.revenue, 0);
  const totalCost = buckets.reduce((acc, b) => acc + b.cost, 0);
  const totalMarginPct =
    totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : null;

  return (
    <div className="border-t border-gray-100">
      {/* Revenue / Qty / COGS / Margin — the same four figures the desktop
          report totals on, so a phone and a desk agree on the summary. */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-[#1e2a4a]/15 flex-shrink-0 bg-custom-white">
        <div className="px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
            Revenue
          </div>
          <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums">
            {formatCurrency2(totalRevenue)}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
            Qty
          </div>
          <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums">
            {totalQty.toLocaleString()}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
            COGS
          </div>
          <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums">
            {formatCurrency2(totalCost)}
          </div>
        </div>
        <div className="px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
            Margin
          </div>
          <div
            className={`text-[12px] font-semibold mt-0.5 tabular-nums ${
              totalMarginPct !== null && totalMarginPct < 0
                ? "text-red-800"
                : "text-content"
            }`}
          >
            {totalMarginPct !== null ? `${totalMarginPct.toFixed(2)}%` : "-"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content/85 border-b border-[#1e2a4a]/15">
        <span>Date</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Revenue</span>
        <span className="text-right">U Cost</span>
        <span className="text-right">Margin</span>
      </div>

      <div
        className="overflow-y-auto thin-scrollbar"
        style={{ maxHeight: "50vh" }}
      >
        {[...buckets].reverse().map((b) => {
          const pct = dayMarginPct(b);
          const isNegative = pct !== null && pct < 0;
          const unitCost = b.hasSale ? b.cost / b.qty : null;
          return (
            <div
              key={b.date}
              className={`grid grid-cols-5 px-4 py-2 text-[12px] border-b border-[#1e2a4a]/15 even:bg-row_stripe ${
                b.hasSale ? "" : "text-content/85"
              }`}
            >
              <span className={b.hasSale ? "text-content" : "text-content/85"}>
                {b.label}
              </span>
              <span
                className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/85"}`}
              >
                {b.hasSale ? b.qty : "—"}
              </span>
              <span
                className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/85"}`}
              >
                {b.hasSale ? formatCurrency2(b.revenue) : "—"}
              </span>
              <span
                className={`text-right tabular-nums font-medium ${b.hasSale ? "text-content" : "text-content/85"}`}
              >
                {unitCost !== null ? formatCurrency2(unitCost) : "—"}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyBreakdown;
