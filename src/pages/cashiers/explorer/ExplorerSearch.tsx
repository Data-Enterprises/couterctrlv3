import StorePicker from "../../../components/storePicker/StorePicker";
import DatePickers from "../../../components/datePickers/DatePickers";
import SelectFilter from "../../../components/filters/SelectFilter";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

interface ExplorerSearchProps {
  saleTypes: string[];
  exception: string;
  onExceptionChange: (v: string) => void;
  onFindExceptions: () => void;
  onExplore: () => void;
  loading: boolean;
  message: string;
  rangeDays: number;
  maxRangeDays: number;
  noExceptionsFound: boolean;
  onBack?: () => void;
}

// Entry point for the exception explorer. Deliberately two-stage: the
// exception list comes from cashiers/preflight, which itself needs the dates
// and scope, so the dropdown can only be populated after those are chosen.
// Upside is the user can never pick an exception that returns nothing.
const ExplorerSearch = ({
  saleTypes,
  exception,
  onExceptionChange,
  onFindExceptions,
  onExplore,
  loading,
  message,
  rangeDays,
  maxRangeDays,
  noExceptionsFound,
  onBack,
}: ExplorerSearchProps) => {
  const rangeTooWide = rangeDays > maxRangeDays;
  const hasSaleTypes = saleTypes.length > 0;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-8">
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-content">
            Explore exceptions
          </h2>
          <p className="text-[12px] text-content/60 mt-1">
            Pick a scope and date range, then choose an exception to break down
            by cashier, item, lane, or hour.
          </p>
        </div>

        {/* The explore step walks every page of two endpoints, so it can run
            for a while — the card needs a real indicator, not just a button
            label, or it reads as hung. */}
        {loading && (
          <div className="relative h-24">
            <LoadingIndicator message={message || "Loading…"} />
          </div>
        )}

        {rangeTooWide && (
          <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
            {rangeDays} days selected. Narrow to {maxRangeDays} or fewer — the
            same window Loss Prevention grades against.
          </div>
        )}

        {noExceptionsFound && !rangeTooWide && (
          <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
            No exceptions recorded for this scope and date range.
          </div>
        )}

        <StorePicker />

        <DatePickers showBtn={false} />

        {hasSaleTypes && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-content/70">
              Exception
            </span>
            <SelectFilter
              options={saleTypes.map((t) => ({ value: t, label: t }))}
              value={exception}
              onChange={onExceptionChange}
              placeholder="Choose an exception"
              className="w-full"
            />
          </div>
        )}

        <button
          onClick={hasSaleTypes && exception ? onExplore : onFindExceptions}
          disabled={loading || rangeTooWide || (hasSaleTypes && !exception)}
          className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? message || "Loading…"
            : hasSaleTypes
              ? "Explore transactions"
              : "Find exceptions"}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-2 text-[12px] font-medium text-content/70 hover:text-content transition-colors"
          >
            Back to results
          </button>
        )}
      </div>
    </div>
  );
};

export default ExplorerSearch;
