import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";

interface RecentLookupsStripProps {
  onSelect: (productCode: string) => void;
  variant?: "cards" | "list";
}

const marginColor = (marginPct: number | null) => {
  if (marginPct === null) return "text-content/85";
  return marginPct < 0 ? "text-red-700" : "text-emerald-700";
};

const RecentLookupsStrip = ({
  onSelect,
  variant = "cards",
}: RecentLookupsStripProps) => {
  const { recentLookups } = useAppSelector((s) => s.item);
  if (!recentLookups.length) return null;

  if (variant === "list") {
    // Plain column headers — the sheet's own trigger already says what this
    // list is, so the first column just names what's in it.
    const COLS = "minmax(0, 1fr) 44px 72px 62px 58px";
    return (
      <div>
        <div
          className="grid gap-2 items-baseline pb-1.5 border-b border-[#1e2a4a]/15"
          style={{ gridTemplateColumns: COLS }}
        >
          <span className="text-[10px] font-semibold text-content/85 uppercase tracking-wide">
            Item
          </span>
          <span className="text-[10px] font-semibold text-content/85 uppercase tracking-wide text-right">
            Qty
          </span>
          <span className="text-[10px] font-semibold text-content/85 uppercase tracking-wide text-right">
            Revenue
          </span>
          <span className="text-[10px] font-semibold text-content/85 uppercase tracking-wide text-right">
            U cost
          </span>
          <span className="text-[10px] font-semibold text-content/85 uppercase tracking-wide text-right">
            Margin
          </span>
        </div>
        <div className="max-h-[168px] overflow-y-auto thin-scrollbar">
          {recentLookups.map((r) => (
            <button
              key={r.productCode}
              onClick={() => onSelect(r.productCode)}
              className="w-full grid gap-2 items-baseline py-2 border-b border-[#1e2a4a]/15 even:bg-row_stripe text-left"
              style={{ gridTemplateColumns: COLS }}
            >
              <span className="text-[12px] font-medium text-content truncate">
                {r.description}
              </span>
              <span className="text-[11px] text-content/85 tabular-nums text-right">
                {r.qty.toLocaleString()}
              </span>
              <span className="text-[11px] text-content/85 tabular-nums text-right">
                {formatCurrency2(r.revenue)}
              </span>
              <span className="text-[11px] text-content/85 tabular-nums text-right">
                {formatCurrency2(r.unitCost)}
              </span>
              <span
                className={`text-[11px] font-semibold tabular-nums text-right ${marginColor(r.marginPct)}`}
              >
                {r.marginPct !== null ? `${r.marginPct.toFixed(2)}%` : "-"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[10px] font-semibold text-content/85 uppercase tracking-wide mb-2">
        Recent lookups
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recentLookups.map((r) => (
          <button
            key={r.productCode}
            onClick={() => onSelect(r.productCode)}
            className="flex-shrink-0 w-[92px] border border-content/15 rounded-lg px-2 py-2 text-center"
          >
            <div className="text-[11px] font-medium truncate">
              {r.description}
            </div>
            <div
              className={`text-[11px] font-semibold tabular-nums mt-0.5 ${marginColor(r.marginPct)}`}
            >
              {r.marginPct !== null ? `${r.marginPct.toFixed(2)}% mgn` : "-"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentLookupsStrip;
