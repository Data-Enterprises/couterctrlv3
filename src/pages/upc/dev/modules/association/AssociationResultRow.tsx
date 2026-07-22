import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { formatCurrency2 } from "../../../../../utils";
import type { AssociationItem } from "../../../../../features/upcDevSlice";
import PercentBar from "../../components/PercentBar";

interface Props {
  item: AssociationItem;
  showDepartmentTag?: boolean;
  deltaNote?: string;
  onReroot?: (upc: string) => void;
  onContextMenu?: (e: React.MouseEvent, upc: string) => void;
}

// One row shape shared by both the "Similar items" and "Bought alongside"
// groups — the only difference between them is showDepartmentTag (Similar's
// section header already names the shared department, so tagging every row
// there would just repeat it) and whether the row is drillable.
const AssociationResultRow = ({ item, showDepartmentTag, deltaNote, onReroot, onContextMenu }: Props) => {
  const clickable = Boolean(onReroot);

  return (
    <div
      onClick={() => onReroot?.(item.product_code)}
      onContextMenu={(e) => onContextMenu?.(e, item.product_code)}
      className={`flex items-center gap-2.5 py-2 border-b border-gray-50 last:border-b-0 ${
        clickable ? "cursor-pointer hover:bg-gray-50" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-content truncate">{item.product_description}</span>
          {item.is_seed && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-content flex-shrink-0">
              in your search
            </span>
          )}
          {showDepartmentTag && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-content flex-shrink-0">
              {item.sub_department_description}
            </span>
          )}
        </div>
        <div className="text-[10px] text-content/85 font-mono mt-0.5">
          {item.product_code} · {formatCurrency2(item.revenue)} rev · {item.qty.toLocaleString()} units
        </div>
        {deltaNote && <div className="text-[10px] font-medium text-amber-600 mt-0.5">{deltaNote}</div>}
      </div>
      <div className="w-[150px] flex-shrink-0">
        <PercentBar pct={item.attach_rate} display={`${item.attach_rate.toFixed(1)}%`} />
      </div>
      {clickable && <ChevronRightIcon className="w-3.5 h-3.5 text-content/85 flex-shrink-0" />}
    </div>
  );
};

export default AssociationResultRow;
