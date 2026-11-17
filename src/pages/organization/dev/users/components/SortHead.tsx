// Interfaces
import type { UserSort, UserSortKey } from "../../interfaces";

interface SortHeadProps {
  label: string;
  k: UserSortKey;
  sort: UserSort | null;
  onSort: (key: UserSortKey) => void;
}

/** A sortable column heading on the users grid, with an arrow on the column
 *  in use. */
const SortHead = ({ label, k, sort, onSort }: SortHeadProps) => (
  <button
    type="button"
    onClick={() => onSort(k)}
    aria-label={`Sort by ${label.toLowerCase()}`}
    className="flex items-center gap-1 text-left uppercase tracking-wide font-semibold hover:text-brand_navy"
  >
    {label}
    {sort?.key === k && <span aria-hidden="true">{sort.desc ? "↓" : "↑"}</span>}
  </button>
);

export default SortHead;
