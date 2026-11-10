// Utils
import { formatCurrency2 } from "../../../../../../utils";

interface CellProps {
  net: number | null;
  qty: number | null;
  isQty: boolean;
  className?: string;
}

/** A figure and the one behind it: units over money when grading on units,
 *  money over units otherwise. Null is a period with no sale. */
const Cell = ({ net, qty, isQty, className = "" }: CellProps) => (
  <div className={`flex-shrink-0 ${className}`} style={{ width: 64 }}>
    <div className="text-[13px] font-semibold text-content">
      {isQty
        ? qty !== null
          ? qty.toLocaleString()
          : "—"
        : net !== null
          ? formatCurrency2(net)
          : "—"}
    </div>
    <div className="text-[10px] text-content">
      {isQty
        ? net !== null
          ? formatCurrency2(net)
          : ""
        : qty !== null
          ? `${qty.toLocaleString()} u`
          : ""}
    </div>
  </div>
);

export default Cell;
