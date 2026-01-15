import type { ItemLookupHistory } from "../../features/itemLookupSlice";
import { formatCurrency2, formatDate } from "../../utils";

interface HistoryItemCardProps {
  item: ItemLookupHistory;
}

const HistoryItemCard = ({ item }: HistoryItemCardProps) => {
  return (
    <div className="text-sm bg-custom-white shadow-lg rounded-lg">
      <div className="flex justify-between bg-blue-500 text-custom-white rounded-t-lg py-0.5 px-2">
        <div className="flex gap-1 font-medium">
          <div>{formatDate(item.sale_date)}</div>
        </div>
      </div>

      <div className="flex justify-between px-2 lg:mt-1">
        <div className="flex gap-1">
          <div className="font-medium">Total Sales:</div>
          <div>{formatCurrency2(item.total_sales)}</div>
        </div>
        <div>{item.category_description}</div>
      </div>
      <div className="flex justify-between px-2">
        <div className="flex gap-1">
          <div className="font-medium">Qty:</div>
          <div>{item.qty}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Extended Cost:</div>
          <div>{formatCurrency2(item.extended_cost)}</div>
        </div>
      </div>
      <div className="flex justify-between px-2 lg:pb-1">
        <div className="flex gap-1">
          {/* put price here */}
          <div className="font-medium">Price:</div>
          <div>{formatCurrency2(item.price)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Case Cost:</div>
          <div>{formatCurrency2(item.casecost)}</div>
        </div>
      </div>
    </div>
  );
};

export default HistoryItemCard;
