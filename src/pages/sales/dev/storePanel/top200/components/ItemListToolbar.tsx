// API
import { TOP_ITEMS_SHOWN } from "../../../../../../api/topItems";

// Interfaces
import type { TopItemCompared } from "../utils/topItems";

interface ItemListToolbarProps {
  search: string;
  setSearch: (value: string) => void;
  dept: string;
  setDept: (value: string) => void;
  depts: { value: string; label: string }[];
  /** The rows after search and filter. */
  shown: TopItemCompared[];
  /** Every ranked row. */
  ranked: TopItemCompared[];
}

/** The list's search box, sub dept filter and count. */
const ItemListToolbar = ({
  search,
  setSearch,
  dept,
  setDept,
  depts,
  shown,
  ranked,
}: ItemListToolbarProps) => (
  <div className="flex items-center gap-2 px-2.5 py-1.5 bg-fill_muted border-b border-line_hair flex-shrink-0">
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search item or UPC…"
      aria-label="Search items"
      className="flex-1 min-w-[90px] text-[11.5px] px-2 py-1 rounded-md border border-line_field bg-custom-white text-content"
    />
    {depts.length > 1 && (
      <select
        value={dept}
        onChange={(e) => setDept(e.target.value)}
        aria-label="Filter by sub department"
        className="flex-shrink-0 max-w-[170px] text-[11.5px] pl-1.5 pr-5 py-1 rounded-md border border-line_field bg-custom-white text-content"
      >
        <option value="">All sub depts</option>
        {depts.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    )}
    <span className="flex-shrink-0 text-[10px] font-semibold text-content/95 whitespace-nowrap">
      {shown.length === ranked.length
        ? `Top ${Math.min(ranked.length, TOP_ITEMS_SHOWN)} by sales`
        : `${shown.length} of ${ranked.length}`}
    </span>
  </div>
);

export default ItemListToolbar;
