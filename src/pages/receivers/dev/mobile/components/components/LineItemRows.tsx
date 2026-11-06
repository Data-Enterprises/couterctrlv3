// Utils
import { gmColor, LINE_GRID } from "../utils";
import { formatBigNumber, formatCurrency2 } from "../../../../../../utils";

// Interfaces
import type { ReceiverDetailsItem } from "../../../../../../interfaces";

interface LineItemRowProps {
  details: ReceiverDetailsItem[];
}

const LineItemRows = ({ details }: LineItemRowProps) => {
  return (
    <div className="overflow-y-auto max-h-[320px]">
      {details.map((item, i) => (
        <div
          key={i}
          className="grid px-3 py-1.5 border-b border-gray-50 items-center"
          style={{ gridTemplateColumns: LINE_GRID }}
        >
          <div className="min-w-0 pr-1">
            <div className="text-[10px] text-content truncate">
              {item.product_description}
            </div>
            <div className="text-[10px] text-content/95">
              {item.product_code}
            </div>
          </div>
          <div className="text-[10px] text-content text-right tabular-nums">
            {item.cases}
          </div>
          <div className="text-[10px] text-content text-right tabular-nums">
            {item.units}
          </div>
          <div className="text-[10px] font-semibold text-content text-right tabular-nums">
            {formatCurrency2(item.ext_cost)}
          </div>
          <div
            className={`text-[10px] font-bold text-right tabular-nums ${gmColor(item.gm)}`}
          >
            {formatBigNumber(item.gm, 2)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LineItemRows;
