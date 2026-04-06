import { setItemHistoryModalOpen } from "../../../features/subMarginSlice";
import { useAppDispatch } from "../../../hooks";
import type { SubDeptCost } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { useSubMarginCtx } from "../hooks";

interface CostCardProps {
  cost: SubDeptCost;
  onRefresh: () => void;
}
const CostCard = ({ cost, onRefresh }: CostCardProps) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();

  const handleHistoryClick = () => {
    dispatch(setItemHistoryModalOpen(true));
  };

  return (
    <div className="bg-custom-white rounded-lg shadow-md text-sm">
      <div className="bg-blue-500 text-custom-white px-2 py-0.5 rounded-t-lg font-medium text-[13px] flex justify-between">
        <div>{cost.product_code}</div>
        <div className="font-medium">{ctx.selectedWeekDay || "All Dates"}</div>
      </div>
      <div className="px-2 text-[13px] font-medium">{cost.description}</div>
      <div className="grid grid-cols-4 p-2 gap-y-1 text-[13.5px]">
        <div>
          <div className="text-content/60">Unit Cost:</div>
          <div className="font-medium">
            {formatCurrency2(cost.calculated_cost)}
          </div>
        </div>
        <div>
          <div className="text-content/60">Case Cost:</div>
          <div className="font-medium">{formatCurrency2(cost.cost)}</div>
        </div>
        <div>
          <div className="text-content/60">Qty:</div>
          <div className="font-medium">{formatBigNumber(cost.qty, 0)}</div>
        </div>
        <div>
          <div className="text-content/60">COGS:</div>
          <div className="font-medium">{formatCurrency2(cost.total_cost)}</div>
        </div>
      </div>
      {ctx.scannedUpc.length && ctx.scannedItemHistory.length ? (
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

export default CostCard;
