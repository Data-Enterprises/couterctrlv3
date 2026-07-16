import { useState } from "react";
import BottomSheet from "../../../components/BottomSheet";
import { formatCurrency2 } from "../../../utils";
import type { DayBucket } from "./lookupMetrics";

interface DailyBreakdownSheetProps {
  description: string;
  buckets: DayBucket[];
  onClose: () => void;
}

type BreakdownView = "margin" | "cost";

const dayMarginPct = (b: DayBucket): number | null =>
  b.hasSale && b.revenue > 0 ? ((b.revenue - b.cost) / b.revenue) * 100 : null;

const DailyBreakdownSheet = ({ description, buckets, onClose }: DailyBreakdownSheetProps) => {
  const [view, setView] = useState<BreakdownView>("margin");

  const totalQty = buckets.reduce((acc, b) => acc + b.qty, 0);
  const totalRevenue = buckets.reduce((acc, b) => acc + b.revenue, 0);
  const totalCost = buckets.reduce((acc, b) => acc + b.cost, 0);
  const avgPrice = totalQty > 0 ? totalRevenue / totalQty : 0;
  const avgUnitCost = totalQty > 0 ? totalCost / totalQty : 0;

  return (
    <BottomSheet onClose={onClose}>
      <div className="px-4 pb-3 border-b border-gray-100 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-content truncate">{description}</div>
          <div className="text-[10px] text-content/85 mt-0.5">Daily breakdown · last 14 days</div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 border border-gray-200 rounded-md p-0.5">
          <button
            onClick={() => setView("margin")}
            className={`px-2 py-1 rounded text-[10.5px] font-medium transition-colors ${
              view === "margin" ? "bg-[#1e2a4a] text-custom-white" : "text-content/85"
            }`}
          >
            Margin
          </button>
          <button
            onClick={() => setView("cost")}
            className={`px-2 py-1 rounded text-[10.5px] font-medium transition-colors ${
              view === "cost" ? "bg-[#1e2a4a] text-custom-white" : "text-content/85"
            }`}
          >
            Cost
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 flex-shrink-0">
        <div className="px-3 py-2">
          <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">Total units</div>
          <div className="text-[13px] font-semibold text-content mt-0.5">{totalQty}</div>
        </div>
        {view === "margin" ? (
          <>
            <div className="px-3 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">Revenue</div>
              <div className="text-[13px] font-semibold text-content mt-0.5">{formatCurrency2(totalRevenue)}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">Avg price</div>
              <div className="text-[13px] font-semibold text-content mt-0.5">{formatCurrency2(avgPrice)}</div>
            </div>
          </>
        ) : (
          <>
            <div className="px-3 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">Total cost</div>
              <div className="text-[13px] font-semibold text-content mt-0.5">{formatCurrency2(totalCost)}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">Avg unit cost</div>
              <div className="text-[13px] font-semibold text-content mt-0.5">{formatCurrency2(avgUnitCost)}</div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-4 px-4 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content/85 border-b border-gray-100">
        <span>Date</span>
        <span className="text-right">Qty</span>
        <span className="text-right">{view === "margin" ? "Revenue" : "Case Cost"}</span>
        <span className="text-right">{view === "margin" ? "Margin" : "Cost"}</span>
      </div>

      <div className="overflow-y-auto thin-scrollbar" style={{ maxHeight: "50vh" }}>
        {[...buckets].reverse().map((b) => {
          const pct = dayMarginPct(b);
          const isNegative = pct !== null && pct < 0;
          const unitCost = b.hasSale ? b.cost / b.qty : null;
          return (
            <div
              key={b.date}
              className={`grid grid-cols-4 px-4 py-2 text-[12px] border-b border-gray-50 ${b.hasSale ? "" : "bg-gray-50/60"}`}
            >
              <span className={b.hasSale ? "text-content" : "text-content/85"}>{b.label}</span>
              <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/85"}`}>
                {b.hasSale ? b.qty : "—"}
              </span>
              {view === "margin" ? (
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/85"}`}>
                  {b.hasSale ? formatCurrency2(b.revenue) : "—"}
                </span>
              ) : (
                <span className={`text-right tabular-nums ${b.hasSale ? "text-content" : "text-content/85"}`}>
                  {b.hasSale ? formatCurrency2(b.cost) : "—"}
                </span>
              )}
              {view === "margin" ? (
                <span
                  className={`text-right tabular-nums font-medium ${
                    !b.hasSale ? "text-content/85" : isNegative ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {pct !== null ? `${pct.toFixed(1)}%` : "—"}
                </span>
              ) : (
                <span className={`text-right tabular-nums font-medium ${b.hasSale ? "text-content" : "text-content/85"}`}>
                  {unitCost !== null ? formatCurrency2(unitCost) : "—"}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
};

export default DailyBreakdownSheet;
