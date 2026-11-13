// Interfaces
import type { ItemSortColumn, ItemSortState } from "../../interfaces";

interface CompareSortHeadProps {
  label: string;
  column: ItemSortColumn;
  sort: ItemSortState;
  onSort: (c: ItemSortColumn) => void;
}

/** A column heading that sorts both lists by it; the sorted one turns navy
 *  with its direction. */
const CompareSortHead = ({ label, column, sort, onSort }: CompareSortHeadProps) => {
  const on = sort?.column === column;
  return (
    <button
      onClick={() => onSort(column)}
      title={`Sort both lists by ${label}`}
      className={`cc-caps text-[10px] text-right hover:text-brand_navy ${on ? "text-brand_navy font-bold" : ""}`}
    >
      {label}
      {on ? (sort.direction === "desc" ? " ▾" : " ▴") : ""}
    </button>
  );
};

export default CompareSortHead;
