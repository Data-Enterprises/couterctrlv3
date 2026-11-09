// Hooks
import { useSearchPick } from "../../../../hooks";

// Components
import StorePicker from "../../../../components-dev/storePicker/StorePicker";
import DatePickers from "../../../../components-dev/datePickers/DatePickers";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";

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

/** The Cashiers entry card for the exception explorer, in two stages: pick the store or group and dates, then an
 *  exception type. Cashiers/preflight needs the dates and scope first, so the dropdown only offers exceptions
 *  that return something. */
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
  const { nothingPicked, pickLabel } = useSearchPick();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3rem)] overflow-hidden mx-4 pb-8">
      <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold text-content">
            Explore exceptions
          </h2>
          <p className="text-[12px] text-content/95 mt-1">
            Pick a scope and date range, then choose an exception to break down
            by cashier, item, lane, or hour.
          </p>
        </div>

        {/* The explore step walks every page of two endpoints, so the card
            shows a real indicator. */}
        {loading && (
          <div className="relative h-24">
            <LoadingIndicator message={message || "Loading…"} />
          </div>
        )}

        {rangeTooWide && (
          <div className="px-2.5 py-2 rounded-lg bg-severity_watch_bg text-[11.5px] text-severity_watch_text leading-snug">
            {rangeDays} days selected. Narrow to {maxRangeDays} or fewer — the
            same window Loss Prevention grades against.
          </div>
        )}

        {noExceptionsFound && !rangeTooWide && (
          <div className="px-2.5 py-2 rounded-lg bg-severity_watch_bg text-[11.5px] text-severity_watch_text leading-snug">
            No exceptions recorded for this scope and date range.
          </div>
        )}

        <StorePicker />

        <DatePickers showBtn={false} />

        {hasSaleTypes && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-content/95">
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
          disabled={loading || nothingPicked || rangeTooWide || (hasSaleTypes && !exception)}
          className="w-full py-2 text-sm font-semibold text-custom-white rounded-lg bg-brand_navy hover:bg-brand_navy_hover transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? message || "Loading…"
            : nothingPicked
              ? pickLabel
              : hasSaleTypes
              ? "Explore transactions"
              : "Find exceptions"}
        </button>

        {onBack && (
          <button
            onClick={onBack}
            className="w-full py-2 text-[12px] font-medium text-content/95 hover:text-content transition-colors"
          >
            Back to results
          </button>
        )}
      </div>
    </div>
  );
};

export default ExplorerSearch;
