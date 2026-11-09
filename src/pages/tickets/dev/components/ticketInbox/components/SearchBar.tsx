import type { QueueTab } from "../../../../../../features/dev/devTicketsSlice";

interface SearchBarProps {
  search: string;
  onSearch: (value: string) => void;
  isTech: boolean;
  tab: QueueTab;
  onTab: (tab: QueueTab) => void;
  urgent: number;
  onRefresh: () => void;
  loading: boolean;
  pending: boolean;
}

/** The ticket search box with the Urgent shortcut (techs only) and a refresh button that reads "New" when the queue has moved. */
const SearchBar = ({
  search,
  onSearch,
  isTech,
  onTab,
  urgent,
  tab,
  onRefresh,
  loading,
  pending,
}: SearchBarProps) => {
  return (
    <div className="mt-2 flex items-center gap-1.5">
      <label htmlFor="ticket-search" className="sr-only">
        Search tickets
      </label>
      <input
        data-help="search"
        id="ticket-search"
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder={isTech ? "Search the queue" : "Search your tickets"}
        className="min-w-0 flex-1 rounded-lg border border-brand_line bg-bkg px-3 py-2 text-[12.5px]"
      />
      {/* Tinted only while there is something to see: a zero in severity
              red is a false alarm every time the queue is clean. */}
      {isTech && (
        <button
          type="button"
          onClick={() => onTab("urgent")}
          aria-pressed={tab === "urgent"}
          title="Tickets that cannot wait"
          className={`flex-none rounded-lg border px-2.5 py-2 text-[12px] font-semibold transition-colors ${
            tab === "urgent"
              ? "border-severity_critical_text bg-severity_critical_text text-custom-white"
              : urgent > 0
                ? "border-severity_critical_text/25 bg-severity_critical_bg text-severity_critical_text"
                : "border-brand_line_2 text-content/85 hover:border-brand_slate"
          }`}
        >
          Urgent <span className="tabular-nums">{urgent}</span>
        </button>
      )}
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        title={
          pending ? "The queue has moved since this list was read" : "Refresh"
        }
        aria-label="Refresh"
        className={`flex-none rounded-lg border px-2.5 py-2 text-[12px] transition-colors disabled:opacity-40 ${
          pending
            ? "border-filter_active_border bg-filter_active font-semibold text-brand_navy_hover"
            : "border-brand_line_2 hover:border-brand_slate"
        }`}
      >
        {loading ? "…" : pending ? "New" : "↻"}
      </button>
    </div>
  );
};

export default SearchBar;
