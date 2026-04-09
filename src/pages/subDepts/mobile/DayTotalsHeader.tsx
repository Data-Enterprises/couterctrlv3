import { useSubMarginCtx } from "../hooks";
import { useAppSelector } from "../../../hooks";
import type { BarData } from "../display/widgets";
import { gpm } from "../../../functions";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface TotalsHeaderProps {
  barData: BarData;
}

const TotalsHeader = ({ barData }: TotalsHeaderProps) => {
  const ctx = useSubMarginCtx();
  const { assignedStores } = useAppSelector((state) => state.user);

  const sales = barData.sales;
  const tax = barData.tax;
  const qty = barData.qty;
  const cogs = barData.cogs;
  const margin = gpm(sales, cogs);
  const date = barData.date;

  const findStoreName = () => {
    return (
      assignedStores.find((store) => store.storeid === ctx.searchValue)
        ?.store_name || ""
    );
  };

  const findSubDeptName = () => {
    const subDept = ctx.subDepts.find((s) => s.id === ctx.selectedSubDeptId);
    return subDept ? subDept.desc : "";
  };

  return (
    <div className="text-[13px] pb-2 px-2 grid grid-cols-2 bg-custom-white rounded-lg shadow-md">
      <div>
        <div className="font-medium">{findStoreName()}</div>
        <div className="font-medium">{findSubDeptName()}</div>
        <div className="flex gap-1.5">
          <div className="text-content/50">Sales:</div>
          <div className="font-medium">{formatCurrency2(sales)}</div>
        </div>
        <div className="flex gap-1.5">
          <div className="text-content/50">Qty:</div>
          <div className="font-medium">{formatBigNumber(qty, 0)}</div>
        </div>
      </div>
      <div className="">
        <div className="text-right font-medium">{date}</div>
        <div className="flex gap-1.5 justify-end">
          <div className="text-content/50">Tax:</div>
          <div className="font-medium">{formatCurrency2(tax)}</div>
        </div>
        <div className="flex gap-1.5 justify-end">
          <div className="text-content/50">COGS:</div>
          <div className="font-medium">{formatCurrency2(cogs)}</div>
        </div>
        <div className="flex gap-1.5 justify-end">
          <div className="text-content/50">GPM:</div>
          <div className="font-medium">{margin}</div>
        </div>
      </div>
    </div>
  );
};

export default TotalsHeader;
