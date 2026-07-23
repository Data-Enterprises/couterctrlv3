import { formatCurrency2 } from "../../../../../utils";
import type { PricePoint } from "./priceOptStats";

interface Props {
  points: PricePoint[];
  bestPrice: number;
}

// Price Opt's equivalent of Sales Comp's day-of-week grid — a variable-
// length list rather than a fixed 7-cell shape, since price points aren't
// tied to a calendar. No profit column and no "current" row — there's no
// current price or cost anywhere in this data, only the best-by-revenue
// row gets a tinted background.
const PriceOptPricePointsTable = ({ points, bestPrice }: Props) => {
  const sorted = [...points].sort((a, b) => b.revenue - a.revenue);
  const cols = "1fr 70px 90px";

  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-content bg-gray-200/75 px-2 py-1.5 mb-1">
        Price points tested
      </div>
      <div className="grid gap-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-content/85" style={{ gridTemplateColumns: cols }}>
        <span>Price</span>
        <span className="text-right">Qty</span>
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
            <span className="text-right text-[13px] tabular-nums text-content">{p.qty.toLocaleString()}</span>
            <span className="text-right text-[13px] tabular-nums text-content">{formatCurrency2(p.revenue)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default PriceOptPricePointsTable;
