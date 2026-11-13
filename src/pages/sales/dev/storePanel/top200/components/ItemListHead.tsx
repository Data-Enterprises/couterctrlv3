// Utils
import {
  nextTopItemSort,
  type TopItemSort,
  type TopItemSortCol,
} from "../utils/topItems";

// Interfaces
import type { Dispatch, SetStateAction } from "react";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";

interface ItemListHeadProps {
  sort: TopItemSort;
  setSort: Dispatch<SetStateAction<TopItemSort>>;
}

/** The list's column headings. */
const ItemListHead = ({ sort, setSort }: ItemListHeadProps) => {
  /** A column heading that sorts. Chevron only on the column in force, the
   *  way every other grid on this page marks it. */
  const SortHead = ({
    col,
    className,
    children,
  }: {
    col: TopItemSortCol;
    className: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => setSort((cur) => nextTopItemSort(cur, col))}
      className={`flex items-center gap-0.5 text-[11.5px] cc-caps hover:text-content flex-shrink-0 ${className}`}
    >
      {children}
      {sort.column === col &&
        (sort.direction === "desc" ? (
          <ChevronDownIcon className="w-3 h-3" />
        ) : (
          <ChevronUpIcon className="w-3 h-3" />
        ))}
    </button>
  );

  return (
    <div className="flex items-center gap-2.5 px-3 py-1.5 border-b border-line_hair flex-shrink-0">
      <span className="w-2.5 flex-shrink-0" />
      <SortHead col="item" className="flex-1 min-w-0 justify-start">
        Item
      </SortHead>
      <SortHead col="sales" className="w-[68px] justify-end pl-2.5">
        Sales
      </SortHead>
      <SortHead col="vsLW" className="w-[56px] justify-center">
        vs LW
      </SortHead>
      <SortHead col="vsLY" className="w-[56px] justify-center">
        vs LY
      </SortHead>
    </div>
  );
};

export default ItemListHead;
