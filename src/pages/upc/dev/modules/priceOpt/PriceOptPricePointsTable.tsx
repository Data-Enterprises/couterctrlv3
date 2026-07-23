import { formatCurrency2 } from "../../../../../utils";
import type { PricePoint } from "./priceOptStats";

interface Props {
  points: PricePoint[];
  bestPrice: number;
  currentPrice: number | null;
  currentCost: number | null;
}

// Price Opt's equivalent of Sales Comp's day-of-week grid — a variable-
// length list rather than a fixed 7-cell shape, since price points aren't
// tied to a calendar. Profit column only renders once cost is known (Store
// search, or Group search once a store's picked); best/current rows get a
// tinted background the same way Sales Comp tints delta cells.
const PriceOptPricePointsTable = ({ points, bestPrice, currentPrice, currentCost }: Props) => {
  const showProfit = currentCost !== null;
  const sorted = [...points].sort((a, b) => b.revenue - a.revenue);
  const cols = showProfit ? "1fr 70px 90px 90px" : "1fr 70px 90px";

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-content bg-gray-200/75 px-2 py-1.5 mb-1">
        Price points tested
      </div>
      <div className="grid gap-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-content/85" style={{ gridTemplateColumns: cols }}>
        <span>Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Revenue</span>
        {showProfit && <span className="text-right">Profit</span>}
      </div>
      {sorted.map((p) => {
        const isBest = p.price === bestPrice;
        const isCurrent = currentPrice !== null && p.price === currentPrice;
        return (
          <div
            key={p.price}
            className={`grid gap-1 items-center px-2 py-1.5 rounded ${
              isBest ? "bg-severity_healthy_bg" : isCurrent ? "bg-severity_critical_bg" : ""
            }`}
            style={{ gridTemplateColumns: cols }}
          >
            <span className="text-[13px] font-semibold text-content">
              {formatCurrency2(p.price)}
              {isBest && <span className="ml-1.5 text-[10px] font-semibold text-severity_healthy_text">best</span>}
              {isCurrent && <span className="ml-1.5 text-[10px] font-semibold text-severity_critical_text">current</span>}
            </span>
            <span className="text-right text-[13px] tabular-nums text-content">{p.qty.toLocaleString()}</span>
            <span className="text-right text-[13px] tabular-nums text-content">{formatCurrency2(p.revenue)}</span>
            {showProfit && currentCost !== null && (
              <span className="text-right text-[13px] font-semibold tabular-nums text-content">
                {formatCurrency2((p.price - currentCost) * p.qty)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PriceOptPricePointsTable;
