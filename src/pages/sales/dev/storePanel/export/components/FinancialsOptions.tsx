// Interfaces
import type { ReactNode } from "react";

interface FinancialsOptionsProps {
  /** The search is still reading its financials. */
  loading: boolean;
  /** The rows the search brought back answer these dates. */
  inHand: boolean;
  recordCount: number;
  capped: boolean;
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onThisWeek: () => void;
  /** The store picker, when the search was a group. */
  children?: ReactNode;
}

const FinancialsOptions = ({
  loading,
  inHand,
  recordCount,
  capped,
  from,
  to,
  onFromChange,
  onToChange,
  onThisWeek,
  children,
}: FinancialsOptionsProps) => (
  <div className="ml-[26px] mt-2 rounded-lg bg-bkg shadow-card-sm px-3 py-2.5">
    <p className="text-[10px] text-content/85 leading-snug mb-2">
      {loading
        ? "Reading the records for this search…"
        : inHand
          ? `${recordCount.toLocaleString()} records in hand for this week${
              capped ? " (capped)" : ""
            }`
          : "These dates are outside the search — they will be fetched on download."}
    </p>
    <div className="flex items-end gap-2 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
          From
        </span>
        <input
          type="date"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value)}
          className="text-[11.5px] px-2 py-1 rounded-md border border-gray-200 text-content bg-custom-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
          To
        </span>
        <input
          type="date"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
          className="text-[11.5px] px-2 py-1 rounded-md border border-gray-200 text-content bg-custom-white"
        />
      </div>
      <button
        onClick={onThisWeek}
        className="text-[11px] font-semibold text-content/85 hover:underline pb-1.5"
      >
        This week
      </button>
    </div>

    {children}
  </div>
);

export default FinancialsOptions;
