// Hooks
import { useMemo, useState } from "react";

// Utils
import { formatCurrency2 } from "../../../../../../utils";
import { sortByAttachRateDesc } from "../associationStats";
import { COLS, getSortValue } from "../utils";

// Interfaces
import type { SortCol } from "../interfaces";
import type { AssociationItem } from "../../../../../../features/dev/devUpcDevSlice";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import ColFilter from "../../../../../../components-dev/filters/ColFilterPopover";
import { colInputStyle } from "../../../../../../components-dev/filters/colFilterStyles";

interface AssociationItemsTableProps {
  items: AssociationItem[];
  onReroot: (upc: string) => void;
  onContextMenu: (e: React.MouseEvent, upc: string) => void;
}

/** The companion items table: product, sub dept, qty, baskets, revenue, avg price and
 *  attach rate. Click a row to re-root on it, right-click for the UPC menu. Shaped like
 *  PriceOptPricePointsTable, with the app's column-header sort and filter conventions;
 *  Sub Dept and Attach stay plain columns. */
const AssociationItemsTable = ({ items, onReroot, onContextMenu }: AssociationItemsTableProps) => {
  const [colSort, setColSort] = useState<{ col: SortCol; dir: "desc" | "asc" } | null>(null);
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");

  const handleColSortClick = (col: SortCol) => {
    setColSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });
  };

  const sorted = useMemo(() => {
    const filtered = appliedDesc
      ? items.filter((i) => i.product_description.toLowerCase().includes(appliedDesc.toLowerCase()))
      : items;
    if (!colSort) return sortByAttachRateDesc(filtered);
    const { col, dir } = colSort;
    return [...filtered].sort((a, b) =>
      dir === "desc" ? getSortValue(b, col) - getSortValue(a, col) : getSortValue(a, col) - getSortValue(b, col),
    );
  }, [items, appliedDesc, colSort]);

  const sortIcon = (col: SortCol) =>
    colSort?.col === col ? (
      colSort.dir === "desc" ? (
        <ChevronDownIcon className="w-3 h-3" />
      ) : (
        <ChevronUpIcon className="w-3 h-3" />
      )
    ) : null;

  return (
    <div>
      <div
        className="sticky top-0 z-10 bg-custom-white grid gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-content/85"
        style={{ gridTemplateColumns: COLS }}
      >
        <ColFilter
          label="Product"
          active={!!appliedDesc}
          onApply={() => setAppliedDesc(draftDesc)}
          onClear={() => {
            setAppliedDesc("");
            setDraftDesc("");
          }}
        >
          <input
            autoFocus
            style={colInputStyle}
            placeholder="Search description…"
            value={draftDesc}
            onChange={(e) => setDraftDesc(e.target.value)}
          />
        </ColFilter>
        <span>Sub Dept</span>
        <button
          onClick={() => handleColSortClick("qty")}
          className="flex items-center justify-end gap-0.5 text-right hover:text-content"
        >
          Qty {sortIcon("qty")}
        </button>
        <button
          onClick={() => handleColSortClick("basket_count")}
          className="flex items-center justify-end gap-0.5 text-right hover:text-content"
        >
          Baskets {sortIcon("basket_count")}
        </button>
        <button
          onClick={() => handleColSortClick("revenue")}
          className="flex items-center justify-end gap-0.5 text-right hover:text-content"
        >
          Revenue {sortIcon("revenue")}
        </button>
        <button
          onClick={() => handleColSortClick("avg_price")}
          className="flex items-center justify-end gap-0.5 text-right hover:text-content"
        >
          Avg $ {sortIcon("avg_price")}
        </button>
        <span className="text-right">Attach</span>
      </div>
      {sorted.map((item, idx) => (
        <div
          key={idx}
          onClick={() => onReroot(item.product_code)}
          onContextMenu={(e) => onContextMenu(e, item.product_code)}
          className="grid gap-1.5 items-center px-2 py-[7px] border-b border-brand_navy/15 last:border-b-0 cursor-pointer even:bg-row_stripe hover:bg-gray-50"
          style={{ gridTemplateColumns: COLS }}
        >
          <div className="min-w-0">
            <div className="text-[12.5px] font-medium text-content truncate">
              {item.product_description}
            </div>
          </div>
          <span className="text-[11px] text-content/85 truncate">
            {item.sub_department_description}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {item.qty.toLocaleString()}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {item.basket_count.toLocaleString()}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {formatCurrency2(item.revenue)}
          </span>
          <span className="text-right text-[12px] tabular-nums text-content">
            {formatCurrency2(item.avg_price)}
          </span>
          <span className="text-right text-[13px] font-bold tabular-nums text-content">
            {item.attach_rate.toFixed(1)}%
          </span>
        </div>
      ))}
      {sorted.length === 0 && (
        <div className="text-[12px] text-content/85 italic py-3 text-center">No matching products.</div>
      )}
    </div>
  );
};

export default AssociationItemsTable;
