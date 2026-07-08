import { useAppSelector } from "../../../hooks";

interface RecentLookupsStripProps {
  onSelect: (productCode: string) => void;
  variant?: "cards" | "list";
}

const marginColor = (marginPct: number | null) => {
  if (marginPct === null) return "text-content/75";
  return marginPct < 0 ? "text-red-700" : "text-emerald-700";
};

const RecentLookupsStrip = ({ onSelect, variant = "cards" }: RecentLookupsStripProps) => {
  const { recentLookups } = useAppSelector((s) => s.item);
  if (!recentLookups.length) return null;

  if (variant === "list") {
    return (
      <div>
        <div className="text-[9px] font-semibold text-content/75 uppercase tracking-wide mb-1.5">
          Recent lookups
        </div>
        <div className="max-h-[168px] overflow-y-auto thin-scrollbar border-t border-content/10">
          {recentLookups.map((r) => (
            <button
              key={r.productCode}
              onClick={() => onSelect(r.productCode)}
              className="w-full flex items-center justify-between gap-2 py-2 border-b border-content/10 text-left"
            >
              <span className="text-[12px] font-medium text-content truncate">{r.description}</span>
              <span className={`text-[11px] font-semibold tabular-nums flex-shrink-0 ${marginColor(r.marginPct)}`}>
                {r.marginPct !== null ? `${r.marginPct.toFixed(1)}%` : "-"}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="text-[9px] font-semibold text-content/75 uppercase tracking-wide mb-2">
        Recent lookups
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {recentLookups.map((r) => (
          <button
            key={r.productCode}
            onClick={() => onSelect(r.productCode)}
            className="flex-shrink-0 w-[92px] border border-content/15 rounded-lg px-2 py-2 text-center"
          >
            <div className="text-[11px] font-medium truncate">{r.description}</div>
            <div className={`text-[11px] font-semibold tabular-nums mt-0.5 ${marginColor(r.marginPct)}`}>
              {r.marginPct !== null ? `${r.marginPct.toFixed(1)}% mgn` : "-"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RecentLookupsStrip;
