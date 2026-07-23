import { useMemo, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/16/solid";
import { formatCurrency2 } from "../../../../../utils";
import type { AssociationItem } from "../../../../../features/upcDevSlice";
import ColFilter from "../../components/ColFilter";
import { colFilterInputStyle } from "../../components/colFilterInputStyle";
import { sortByAttachRateDesc } from "./associationStats";

interface Props {
  items: AssociationItem[];
  onReroot: (upc: string) => void;
  onContextMenu: (e: React.MouseEvent, upc: string) => void;
}

const COLS = "1fr 110px 60px 70px 80px 70px 75px";

type SortCol = "qty" | "basket_count" | "revenue" | "avg_price";

const getSortValue = (item: AssociationItem, col: SortCol) => item[col];

// Mirrors PriceOptPricePointsTable.tsx's shape — a variable-length list of
// items with several numeric attributes each maps naturally onto columns,
// same as Price Opt's price-point history did. Sortable columns and the
// product-description filter follow the app's established column-header
// conventions (see ColFilter.tsx and MarginPerfItemsTable.tsx's colSort
// pattern) rather than inventing new ones. Department and Attach stay
// plain, non-interactive columns by design — Attach rate is the table's
// own default sort, and Department doesn't need its own filter/sort here.
const AssociationItemsTable = ({ items, onReroot, onContextMenu }: Props) => {
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
            style={colFilterInputStyle}
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
          className="grid gap-1.5 items-center px-2 py-[7px] border-b border-[#1e2a4a]/15 last:border-b-0 cursor-pointer even:bg-row_stripe hover:bg-gray-50"
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
