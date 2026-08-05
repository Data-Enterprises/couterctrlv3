import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import type { SortState } from "../utils/useTriStateSort";

/**
 * The Performance left-panel column-header look — identical type scale to the
 * static headers these replaced, so making a column sortable doesn't restyle
 * the header row around it.
 */
export const PERF_SORT_HEADER =
  "text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0";

interface SortHeaderProps<C extends string> {
  col: C;
  label: string;
  sort: SortState<C>;
  onSort: (col: C) => void;
  className?: string;
  /** Column width, matching the cells beneath it. */
  width?: number;
}

/**
 * Column header that participates in the tri-state sort.
 *
 * The chevron only renders on the active column, so an unsorted list stays
 * visually quiet — nothing about the header row announces the feature until
 * it's used.
 */
const SortHeader = <C extends string>({
  col,
  label,
  sort,
  onSort,
  className = "",
  width,
}: SortHeaderProps<C>) => (
  <button
    onClick={() => onSort(col)}
    className={`flex items-center gap-0.5 transition-colors ${className}`}
    style={width === undefined ? undefined : { width }}
    title={`Sort by ${label}`}
  >
    {label}
    {sort?.col === col &&
      (sort.dir === "desc" ? (
        <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
      ) : (
        <ChevronUpIcon className="w-3 h-3 flex-shrink-0" />
      ))}
  </button>
);

export default SortHeader;
