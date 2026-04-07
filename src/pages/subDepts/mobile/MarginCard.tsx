import { setItemHistoryModalOpen } from "../../../features/subMarginSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { ItemRow } from "../display/widgets";
import { useSubMarginCtx } from "../hooks";

interface MarginCardProps {
  item: ItemRow;
  onRefresh: () => void;
}
const MarginCard = ({ item, onRefresh }: MarginCardProps) => {
  const ctx = useSubMarginCtx();
  const { upcCode } = useAppSelector((state) => state.itemScan);
  const dispatch = useAppDispatch();

  const handleHistoryClick = () => {
    dispatch(setItemHistoryModalOpen(true));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-md text-sm">
      <div className="bg-blue-500 text-custom-white px-2 py-0.5 rounded-t-lg font-medium text-[13px] flex justify-between">
        <div>{item.product_code}</div>
        <div className="font-medium">{ctx.selectedWeekDay || "All Dates"}</div>
      </div>
      <div className="px-2 text-[13px] font-medium">
        {item.product_description}
      </div>
      <div className="grid grid-cols-4 p-2 gap-y-1 text-[13.5px]">
        <div>
          <div className="text-content/60">Total $:</div>{" "}
          <div className="font-medium">{formatCurrency2(item.total_sales)}</div>
        </div>
        <div>
          <div className="text-content/60">COGS:</div>
          <div className="font-medium">{formatCurrency2(item.cogs)}</div>
        </div>
        <div>
          <div className="text-content/60">Qty:</div>
          <div className="font-medium">{formatBigNumber(item.qty, 0)}</div>
        </div>
        <div>
          <div className="text-content/60">Tax:</div>
          <div className="font-medium">{formatCurrency2(item.total_tax)}</div>
        </div>
        <div>
          <div className="text-content/60">Net $:</div>
          <div className="font-medium">{formatCurrency2(item.net_sales)}</div>
        </div>
        <div>
          <div className="text-content/60">Cost Fees:</div>
          <div className="font-medium">{item.cost_fees.toFixed(2)}%</div>
        </div>
        <div>
          <div className="text-content/60">GPM:</div>
          <div className="font-medium">{item.margin.toFixed(2)}%</div>
        </div>
      </div>
      {upcCode.length && ctx.scannedItemHistory.length ? (
        <div className="px-2 pb-2 grid grid-cols-2 gap-2">
          <button
            className="btn-themeBlue w-full px-0 py-1.5"
            onClick={handleHistoryClick}
          >
            View History
          </button>
          <button
            className="btn-themeOrange w-full px-0 py-1.5"
            onClick={onRefresh}
          >
            Refresh
          </button>
        </div>
      ) : null}
    </div>
  );
};

export default MarginCard;
