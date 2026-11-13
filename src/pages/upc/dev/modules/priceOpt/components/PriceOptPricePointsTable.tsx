// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { formatPricedUnitsShort } from "../../../../../../utils/pricedUnits";

// Interfaces
import type { PricePoint } from "../interfaces";

interface PriceOptPricePointsTableProps {
  points: PricePoint[];
  bestPrice: number;
  /** Sold by the pound — the volume column is weight, not a ring count. */
  weighted: boolean;
}

/** Price Opt's version of Sales Comp's day-of-week grid: a variable-length list of price
 *  points with qty (or lb) and revenue. No profit column and no "current" row; the
 *  best-by-revenue row is tinted. */
const PriceOptPricePointsTable = ({ points, bestPrice, weighted }: PriceOptPricePointsTableProps) => {
  const sorted = [...points].sort((a, b) => b.revenue - a.revenue);
  const cols = "1fr 70px 90px";

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-content bg-fill_track/75 px-2 py-1.5 mb-1">
        Price points tested
      </div>
      <div className="grid gap-1 px-2 text-[10px] cc-caps" style={{ gridTemplateColumns: cols }}>
        <span>Price</span>
        {/* One item per table, so the header names its unit outright. */}
        <span className="text-right">{weighted ? "Lb" : "Qty"}</span>
        <span className="text-right">Revenue</span>
      </div>
      {sorted.map((p) => {
        const isBest = p.price === bestPrice;
        return (
          <div
            key={p.price}
            className={`grid gap-1 items-center px-2 py-1.5 rounded ${isBest ? "bg-severity_healthy_bg" : ""}`}
            style={{ gridTemplateColumns: cols }}
          >
            <span className="text-[13px] font-semibold text-content">
              {formatCurrency2(p.price)}
              {isBest && <span className="ml-1.5 text-[10px] font-semibold text-severity_healthy_text">best</span>}
            </span>
            <span className="text-right text-[13px] tabular-nums text-content">
              {weighted ? formatPricedUnitsShort(p.qty, p.weight) : p.qty.toLocaleString()}
            </span>
            <span className="text-right text-[13px] tabular-nums text-content">{formatCurrency2(p.revenue)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PriceOptPricePointsTable;
