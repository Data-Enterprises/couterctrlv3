// Interfaces
import type { EditSearch } from "../../../interfaces";

// Components
import { PlusIcon } from "@heroicons/react/16/solid";
import SeekField from "./SeekField";

interface EditSearchBarProps {
  search: EditSearch;
  onSearch: (search: EditSearch) => void;
  /** How many lines on the order have changed. */
  changedCount: number;
  locked: boolean;
  pending: boolean;
  onAddLine: () => void;
  /** Changed lines the search is hiding, which still go in the file. */
  hiddenChanged: number;
}

/** The bar over the order's lines: search by code or description, show only
 *  the changed lines, add a line, and a warning when changed lines are hidden. */
const EditSearchBar = ({
  search,
  onSearch,
  changedCount,
  locked,
  pending,
  onAddLine,
  hiddenChanged,
}: EditSearchBarProps) => (
  <div className="flex-shrink-0 flex items-center gap-2 flex-wrap border-b border-brand_line bg-custom-white px-3 py-1.5">
    <SeekField
      id="order-edit-code"
      label="Product code"
      value={search.code}
      placeholder="004900000634"
      onChange={(code) => onSearch({ ...search, code })}
    />
    <SeekField
      id="order-edit-desc"
      label="Description"
      value={search.desc}
      placeholder="coffee"
      onChange={(desc) => onSearch({ ...search, desc })}
    />

    <button
      onClick={() => onSearch({ ...search, onlyChanged: !search.onlyChanged })}
      aria-pressed={search.onlyChanged}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors ${
        search.onlyChanged
          ? "border-filter_active_border bg-filter_active text-content"
          : "border-content/20 bg-custom-white text-content hover:border-content/35"
      }`}
    >
      Only changed
      <span className="tabular-nums">{changedCount}</span>
    </button>

    {!locked && (
      <button
        onClick={onAddLine}
        disabled={pending}
        title={
          pending
            ? "Finish the line you are adding first"
            : "Add a line to the end of this order"
        }
        className="flex items-center gap-1 rounded-full border border-brand_green px-2.5 py-0.5 text-[11px] font-semibold text-brand_green_darker transition-colors hover:bg-brand_green_tint disabled:opacity-45"
      >
        <PlusIcon className="w-3 h-3" />
        Add line
      </button>
    )}

    <div className="flex-1" />

    {hiddenChanged > 0 && (
      <span className="rounded bg-severity_watch_bg px-2 py-0.5 text-[11px] font-semibold text-severity_watch_text">
        {hiddenChanged} changed line{hiddenChanged === 1 ? "" : "s"} hidden by
        this search — still sent
      </span>
    )}
  </div>
);

export default EditSearchBar;
