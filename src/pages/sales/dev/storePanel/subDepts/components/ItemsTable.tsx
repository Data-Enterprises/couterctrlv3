// Hooks
import { useSalesCtx } from "../../../hooks";

// Utils
import { ITEMS_HEAD } from "../utils";

// Interfaces
import type { MouseEvent } from "react";
import type { GradedItem, ItemSortColumn, ItemSortState } from "../interfaces";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import SeverityBadge from "../../../../../../components-dev/SeverityBadge";
import Cell from "./Cell";

interface ItemsTableProps {
  items: GradedItem[];
  sort: ItemSortState;
  onSort: (column: ItemSortColumn) => void;
  /** Right-click on an item: opens the UPC menu for it. */
  onItemMenu: (e: MouseEvent, upc: string) => void;
}

/** The open sub department's items: TY, LW and LY, sortable. */
const ItemsTable = ({ items, sort, onSort, onItemMenu }: ItemsTableProps) => {
  const { gradingMetric } = useSalesCtx();
  const isQty = gradingMetric === "qty";
  const chevron = (column: ItemSortColumn) =>
    sort?.column === column &&
    (sort.direction === "desc" ? (
      <ChevronDownIcon className="w-2.5 h-2.5" />
    ) : (
      <ChevronUpIcon className="w-2.5 h-2.5" />
    ));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 py-1 border-b border-line_hair bg-gray-50 flex-shrink-0">
        <span className="w-[18px] flex-shrink-0" />
        <span className="text-[9px] font-semibold uppercase tracking-wide text-content flex-1">
          Items
        </span>
        <div className="flex items-center gap-[14px]">
          <button onClick={() => onSort("ty")} className={`${ITEMS_HEAD} pl-2.5`} style={{ width: 64 }}>
            TY
            {chevron("ty")}
          </button>
          <button onClick={() => onSort("lw")} className={ITEMS_HEAD} style={{ width: 64 }}>
            LW
            {chevron("lw")}
          </button>
          <button onClick={() => onSort("ly")} className={ITEMS_HEAD} style={{ width: 64 }}>
            LY
            {chevron("ly")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {items.map((item) => (
          <div
            key={item.productCode}
            className="flex items-start gap-2.5 px-3 py-2 border-b border-b-brand_navy/15 last:border-0"
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onItemMenu(e, item.upc);
            }}
          >
            <SeverityBadge severity={item.sev} showBackground={false} />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] font-medium text-content truncate block">
                {item.desc}
              </span>
              <span className="text-[11px] text-content block">{item.upc}</span>
            </div>
            <div className="flex items-start gap-[14px]">
              {/* An item that did not sell this week has no TY figure at all. */}
              {item.hasTY === false ? (
                <div className="flex-shrink-0 pl-2.5" style={{ width: 64 }}>
                  <div className="text-[13px] font-semibold text-content">—</div>
                  <div className="text-[10px] text-content"></div>
                </div>
              ) : (
                <Cell net={item.tyNet} qty={item.tyQty} isQty={isQty} className="pl-2.5" />
              )}
              <Cell net={item.lwNet} qty={item.lwQty} isQty={isQty} />
              <Cell net={item.lyNet} qty={item.lyQty} isQty={isQty} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemsTable;
