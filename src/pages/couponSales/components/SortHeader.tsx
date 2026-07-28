import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import type { SortState } from "../shared/useTriStateSort";

interface SortHeaderProps<C extends string> {
  col: C;
  label: string;
  sort: SortState<C>;
  onSort: (col: C) => void;
  className?: string;
}

/** Column header that participates in the tri-state sort. The chevron only
 *  appears on the active column, so an unsorted table stays visually quiet. */
const SortHeader = <C extends string>({
  col,
  label,
  sort,
  onSort,
  className = "",
}: SortHeaderProps<C>) => (
  <button
    onClick={() => onSort(col)}
    className={`flex items-center gap-0.5 uppercase tracking-wide text-content hover:underline transition-colors ${className}`}
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
