import { formatCurrency2 } from "../../utils";
import { DOW } from "./summaryModel";
import type { TypeSummary } from "./summaryModel";

/**
 * The right half of the journey: what the exceptions are, before which ones.
 *
 * With nothing selected this is every type at once, so the shape of a
 * cashier's week is readable without clicking anything. With a type selected
 * it is that type alone, and the receipts sit underneath it — the summary
 * answers "what is this", the list answers "which ones".
 */
const DayStrip = ({ perDay }: { perDay: number[] }) => {
  const peak = Math.max(...perDay, 1);
  return (
    <div className="flex items-end gap-[3px] h-6">
      {perDay.map((n, i) => (
        <div key={DOW[i]} className="flex flex-col items-center gap-0.5">
          <div
            title={`${DOW[i]} — ${n}`}
            style={{ height: Math.max(2, Math.round((n / peak) * 18)) }}
            className={`w-3.5 rounded-sm ${
              n === peak && n > 0 ? "bg-[#1e2a4a]" : "bg-gray-300"
            }`}
          />
          <span className="text-[8.5px] text-content/85 leading-none">
            {DOW[i][0]}
          </span>
        </div>
      ))}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content/85">
      {label}
    </div>
    <div className="text-[14px] font-bold text-content tabular-nums truncate">
      {value}
    </div>
  </div>
);

export const SummaryCard = ({
  s,
  onClick,
  active,
}: {
  s: TypeSummary;
  onClick?: () => void;
  active?: boolean;
}) => (
  <div
    onClick={onClick}
    className={`px-3 py-2.5 border-b border-gray-100 ${
      onClick ? "cursor-pointer hover:bg-gray-50" : ""
    } ${active ? "bg-row_selected" : ""}`}
  >
    <div className="flex items-baseline gap-2 mb-1.5">
      <span className="text-[13px] font-medium text-content flex-1 truncate">
        {s.saleType}
      </span>
      {s.receipts !== s.occurrences && (
        // Only said when the two differ — "47 across 47 receipts" is noise.
        <span className="text-[11px] text-content/85 flex-shrink-0">
          across {s.receipts} {s.receipts === 1 ? "receipt" : "receipts"}
        </span>
      )}
      {s.peakDay && (
        <span className="text-[11px] text-content/85 flex-shrink-0">
          peaks {s.peakDay}
        </span>
      )}
    </div>
    <div className="flex items-end gap-3">
      <div className="grid grid-cols-4 gap-3 flex-1 min-w-0">
        <Metric
          label="Occurrences"
          value={
            s.receipts === s.occurrences
              ? String(s.occurrences)
              : `${s.occurrences} / ${s.receipts}`
          }
        />
        <Metric label="Total" value={formatCurrency2(s.dollars)} />
        <Metric label="Avg" value={formatCurrency2(s.avgDollars)} />
        <Metric label="Days" value={String(s.days)} />
      </div>
      <DayStrip perDay={s.perDay} />
    </div>
  </div>
);

export default SummaryCard;
