import { ArrowTrendingDownIcon, ChevronLeftIcon } from "@heroicons/react/20/solid";
import { formatCurrency2 } from "../../../utils";
import type { MarginResult, DayBucket, TrendResult } from "./lookupMetrics";
import RecentLookupsStrip from "./RecentLookupsStrip";

interface LookupResultScreenProps {
  description: string;
  productCode: string;
  categoryDescription: string;
  storeName: string;
  onBack: () => void;
  onSelectRecent: (productCode: string) => void;
  margin: MarginResult;
  totalQty: number;
  daysSold: number;
  buckets: DayBucket[];
  trend: TrendResult;
  gaps: { start: string; end: string; days: number }[];
}

const LookupResultScreen = ({
  description,
  productCode,
  categoryDescription,
  storeName,
  onBack,
  onSelectRecent,
  margin,
  totalQty,
  daysSold,
  buckets,
  trend,
  gaps,
}: LookupResultScreenProps) => {
  const isNegative = margin.marginPct !== null && margin.marginPct < 0;
  const maxQty = Math.max(...buckets.map((b) => b.qty), 1);

  return (
    <div className="min-h-[calc(100vh-56px)] bg-custom-white">
      <div className="flex-shrink-0 px-3 pt-2 pb-2.5" style={{ background: "#1e2a4a" }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-white/65 hover:text-white transition-colors flex-shrink-0 -ml-1">
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">
              {description}
            </div>
            <div className="text-[10px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
              {productCode} · {categoryDescription} · {storeName}
            </div>
          </div>
        </div>
      </div>

      <div className="p-3.5">
        <div className="bg-content/5 rounded-xl p-3.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-content/45">Margin, last 14 days</span>
            {isNegative && (
              <span className="text-[10px] font-semibold text-red-800">Selling below cost</span>
            )}
          </div>
          <div className={`text-[26px] font-bold mt-0.5 tabular-nums ${isNegative ? "text-red-800" : "text-emerald-800"}`}>
            {margin.marginPct !== null ? `${margin.marginPct.toFixed(1)}%` : "-"}
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 border-t border-content/10 pt-2.5">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-content/45">List price</div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">{formatCurrency2(margin.listPrice)}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-content/45">Avg sold at</div>
              <div className={`text-[13px] font-semibold tabular-nums mt-0.5 ${isNegative ? "text-red-800" : ""}`}>
                {formatCurrency2(margin.avgSoldAt)}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-content/45">Case cost</div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">{formatCurrency2(margin.caseCost)}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2.5 border-t border-content/10 pt-2.5">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-content/45">Total units</div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">{totalQty}</div>
            </div>
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wide text-content/45">Sold on</div>
              <div className="text-[13px] font-semibold tabular-nums mt-0.5">{daysSold} of last 14 days</div>
            </div>
          </div>
        </div>

        {trend.isSlowing && (
          <div className="flex items-center gap-1.5 mt-3 px-2.5 py-2 bg-amber-50 rounded-lg">
            <ArrowTrendingDownIcon className="w-4 h-4 text-amber-800" />
            <span className="text-[11.5px] text-amber-900">
              Slowing down - {trend.firstHalfQty} units first week, {trend.secondHalfQty} units this week
            </span>
          </div>
        )}

        <div className="text-[9px] font-semibold text-content/45 uppercase tracking-wide mt-4 mb-2">
          Daily units sold
        </div>
        <div className="flex items-end gap-1" style={{ height: 70 }}>
          {buckets.map((b) => (
            <div
              key={b.date}
              title={`${b.label} - ${b.hasSale ? `${b.qty} units` : "no sales"}`}
              className={`flex-1 rounded-t-sm ${b.hasSale ? "bg-blue-300" : "bg-red-100"}`}
              style={{ height: b.hasSale ? Math.max((b.qty / maxQty) * 70, 4) : 4 }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-content/45">{buckets[0]?.label}</span>
          <span className="text-[9px] text-content/45">{buckets[buckets.length - 1]?.label}</span>
        </div>

        {gaps.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-2 h-2 bg-red-100 rounded-sm" />
            <span className="text-[10.5px] text-content/60">
              {gaps.map((g) => `${g.days}-day gap with no sales, ${g.start} - ${g.end}`).join("; ")}
            </span>
          </div>
        )}

        <div className="mt-4">
          <RecentLookupsStrip onSelect={onSelectRecent} />
        </div>
      </div>
    </div>
  );
};

export default LookupResultScreen;
