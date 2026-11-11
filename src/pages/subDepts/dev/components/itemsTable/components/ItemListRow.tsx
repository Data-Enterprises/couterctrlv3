// Utils
import {
  getRowMetric,
  SEV_PILL_CLASSES,
  type ItemMarginRow,
  type ItemSeverity as Severity,
  type RowMetricKey,
} from "../../../../../../utils/itemMargins";

// Interfaces
import type { MouseEvent } from "react";

// Components
import ItemSeverityBadge from "./ItemSeverityBadge";

interface ItemListRowProps {
  item: ItemMarginRow;
  sev: Severity;
  isSel: boolean;
  activeMetric: RowMetricKey;
  onSelect: () => void;
  onMenu: (e: MouseEvent) => void;
}

/** One item in the list: its grade, name and UPC, and TY / LW / LY. */
const ItemListRow = ({ item, sev, isSel, activeMetric, onSelect, onMenu }: ItemListRowProps) => {
  const metric = getRowMetric(item, activeMetric);
  return (
    <button
      onClick={onSelect}
      onContextMenu={(e) => {
        e.stopPropagation();
        onMenu(e);
      }}
      className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-brand_navy/15 ${
        isSel
          ? "bg-row_selected border-row_selected_border"
          : "border-transparent hover:bg-fill_soft"
      }`}
    >
      <ItemSeverityBadge severity={sev} />
      <div className="flex flex-col justify-center min-w-0 flex-1">
        <div className="text-[13px] font-medium text-content truncate">
          {item.description}
        </div>
        <div className="text-[11px] text-content tabular-nums truncate">
          {item.productCode}
        </div>
      </div>
      <div className="flex items-center gap-[10px]">
        <span
          className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${SEV_PILL_CLASSES[sev]}`}
          style={{ width: 76 }}
        >
          {metric.tyDisplay}
        </span>
        <span
          className="text-[12px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
          style={{ width: 68 }}
        >
          {metric.lwDisplay ?? "—"}
        </span>
        <span
          className="text-[12px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
          style={{ width: 68 }}
        >
          {metric.lyDisplay ?? "—"}
        </span>
      </div>
    </button>
  );
};

export default ItemListRow;
