import { formatCurrency2 } from "../../../utils";
import type { ItemRow } from "../display/widgets";

interface MarginCardProps {
  item: ItemRow;
}
const MarginCard = ({ item }: MarginCardProps) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-md text-sm">
      <div className="bg-blue-500 text-custom-white px-2 py-0.5 rounded-t-lg font-medium text-[13px] flex justify-between">
        <div>{item.product_code}</div>
        <div>{item.product_description}</div>
      </div>
      <div className="grid grid-cols-4 p-2 gap-y-1 text-[13.5px]">
        <div>
          <div>Total $:</div>{" "}
          <div className="font-medium">{formatCurrency2(item.total_sales)}</div>
        </div>
        <div>
          <div>COGS:</div>
          <div className="font-medium">{formatCurrency2(item.cogs)}</div>
        </div>
        <div>
          <div>Qty:</div>
          <div className="font-medium">{item.qty}</div>
        </div>
        <div>
          <div>Tax:</div>
          <div className="font-medium">{formatCurrency2(item.total_tax)}</div>
        </div>
        <div>
          <div>Net $:</div>
          <div className="font-medium">{formatCurrency2(item.net_sales)}</div>
        </div>
        <div>
          <div>Cost Fees:</div>
          <div className="font-medium">{item.cost_fees.toFixed(2)}%</div>
        </div>
        <div>
          <div>GPM:</div>
          <div className="font-medium">{item.margin.toFixed(2)}%</div>
        </div>
      </div>
    </div>
  );
};

export default MarginCard;
