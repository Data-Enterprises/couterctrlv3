import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { useAppDispatch } from "../../../hooks";
import type { ItemRowMobile } from "../display/widgets";
import { setScannedItemMobile } from "../../../features/subMarginSlice";
import { setUpcCode } from "../../../features/itemScanSlice";

interface MarginCardProps {
  item: ItemRowMobile;
  handleClick: (product_code: string) => void;
}
const ItemCard = ({ item, handleClick }: MarginCardProps) => {
  const dispatch = useAppDispatch();
  const onItemClick = () => {
    dispatch(setUpcCode(item.product_code));
    dispatch(setScannedItemMobile(item));
    handleClick(item.product_code);
  };

  return (
    <div
      className="bg-custom-white even:bg-blue-200/50 text-[13px]"
      onClick={onItemClick}
    >
      <div className="px-2 py-0.5 font-medium grid grid-cols-[1fr_3fr]">
        <div>{item.product_code}</div>
        <div className="text-right text-nowrap truncate">
          {item.product_description}
        </div>
      </div>
      <div className="grid grid-cols-6 px-2 pb-0.5">
        <div>
          <div className="text-content/60">Sales:</div>
          <div>{formatCurrency2(item.total_sales)}</div>
        </div>
        <div>
          <div className="text-content/60">COGS:</div>
          <div>{formatCurrency2(item.cogs)}</div>
        </div>
        <div>
          <div className="text-content/60">GPM:</div>
          <div>{item.margin.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-content/60">Qty:</div>
          <div>{formatBigNumber(item.qty, 0)}</div>
        </div>
        <div>
          <div className="text-content/60">C Cost:</div>
          <div>{formatCurrency2(item.cost)}</div>
        </div>
        <div>
          <div className="text-content/60">U Cost:</div>
          <div>{formatCurrency2(item.calculated_cost)}</div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
