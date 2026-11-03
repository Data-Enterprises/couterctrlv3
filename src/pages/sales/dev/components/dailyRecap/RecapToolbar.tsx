import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";

/**
 * Search, open-or-close-all and the download, inside the tab they act on.
 *
 * The download is the whole week (or the picked day), one row per item per
 * day, whatever is open or searched on screen.
 */
const RecapToolbar = ({
  search,
  onSearch,
  allOpen,
  onToggleAll,
  showToggleAll,
  onDownload,
  downloading,
  note,
}: {
  search: string;
  onSearch: (value: string) => void;
  allOpen: boolean;
  onToggleAll: () => void;
  /** Off for a picked day, which is already open. */
  showToggleAll: boolean;
  onDownload: () => void;
  downloading: boolean;
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
    <button
      type="button"
      onClick={onDownload}
      disabled={downloading}
      title="Download CSV: one row per item per day"
      aria-label="Download CSV, one row per item per day"
      className="h-7 w-8 inline-flex items-center justify-center rounded-md border border-gray-200 text-content hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
    </button>
  </div>
);

export default RecapToolbar;
