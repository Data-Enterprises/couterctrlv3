// Interfaces
import type { ReactNode } from "react";
import type { ItemSort, ItemSortCol } from "../interfaces/index";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

/**
 * A column head in the item view that sorts by its column, as Top 200's do:
 * the chevron only on the column in force, pointing the way it runs.
 */
const RecapSortHead = ({
  col,
  sort,
  onSort,
  right,
  children,
}: {
  col: ItemSortCol;
  sort: ItemSort;
  onSort: (col: ItemSortCol) => void;
  /** A figure column: right-aligned over its numbers. */
  right?: boolean;
  children: ReactNode;
}) => {
  const active = sort.column === col;
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      aria-sort={active ? (sort.direction === "desc" ? "descending" : "ascending") : undefined}
      className={`min-w-0 flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wide text-content ${
        right ? "justify-end" : "justify-start"
      }`}
    >
      <span className="truncate">{children}</span>
      {active &&
        (sort.direction === "desc" ? (
          <ChevronDownIcon className="w-3 h-3 flex-none" />
        ) : (
          <ChevronUpIcon className="w-3 h-3 flex-none" />
        ))}
    </button>
  );
};

export default RecapSortHead;
