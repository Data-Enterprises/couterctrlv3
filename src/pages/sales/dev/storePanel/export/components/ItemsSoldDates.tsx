import { MAX_EXPORT_DAYS } from "../utils/recapRange";

interface ItemsSoldDatesProps {
  /** Items Sold is ticked: the dates do nothing until it is. */
  enabled: boolean;
  from: string;
  to: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  onThisWeek: () => void;
  tooLong: boolean;
}

const ItemsSoldDates = ({
  enabled,
  from,
  to,
  onFromChange,
  onToChange,
  onThisWeek,
  tooLong,
}: ItemsSoldDatesProps) => (
  <div
    aria-disabled={!enabled}
    className={`ml-[26px] mt-2 rounded-lg bg-bkg shadow-card-sm px-3 py-2.5 transition-opacity ${
      enabled ? "" : "opacity-50"
    }`}
  >
    <div className="flex items-end gap-2 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content">
          From
        </span>
        <input
          type="date"
          disabled={!enabled}
          aria-label="Items Sold from"
          value={from}
          max={to}
          onChange={(e) => onFromChange(e.target.value)}
          className="text-[11.5px] px-2 py-1 rounded-md border border-gray-200 text-content bg-custom-white"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wide text-content">
          To
        </span>
        <input
          type="date"
          disabled={!enabled}
          aria-label="Items Sold to"
          value={to}
          min={from}
          onChange={(e) => onToChange(e.target.value)}
          className="text-[11.5px] px-2 py-1 rounded-md border border-gray-200 text-content bg-custom-white"
        />
      </div>
      <button
        type="button"
        disabled={!enabled}
        onClick={onThisWeek}
        className="text-[11px] font-semibold text-content hover:underline pb-1.5"
      >
        This week
      </button>
    </div>
    {tooLong && (
      <p className="text-[10.5px] font-semibold text-severity_watch_text mt-1">
        Pick {MAX_EXPORT_DAYS} days or fewer.
      </p>
    )}
  </div>
);

export default ItemsSoldDates;
