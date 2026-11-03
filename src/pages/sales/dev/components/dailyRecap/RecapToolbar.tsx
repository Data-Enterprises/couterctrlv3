/**
 * Search and open-or-close-all, inside the tab they act on.
 *
 * The download is not here: it is the Daily Recap option in the panel's
 * Export CSV, beside the other Sales exports, so there is one place to export
 * from.
 */
const RecapToolbar = ({
  search,
  onSearch,
  allOpen,
  onToggleAll,
  showToggleAll,
  note,
}: {
  search: string;
  onSearch: (value: string) => void;
  allOpen: boolean;
  onToggleAll: () => void;
  /** Off for a picked day, which is already open. */
  showToggleAll: boolean;
  /** A line beside the search saying what is in view. */
  note?: string;
}) => (
  <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 flex-shrink-0">
    <input
      type="search"
      value={search}
      onChange={(e) => onSearch(e.target.value)}
      placeholder="Search item or UPC…"
      aria-label="Search item or UPC"
      className="basic-input h-8 w-[240px] px-2.5 text-[12px] bg-custom-white"
    />
    {note && <span className="text-[11.5px] text-content truncate">{note}</span>}
    <span className="flex-1" />
    {showToggleAll && (
      <button
        type="button"
        onClick={onToggleAll}
        className="h-7 px-2.5 rounded-md border border-gray-200 text-[11.5px] font-semibold text-content hover:bg-gray-50 transition-colors"
      >
        {allOpen ? "Collapse all" : "Expand all"}
      </button>
    )}
  </div>
);

export default RecapToolbar;
