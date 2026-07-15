import { useSubMarginCtx } from "../hooks";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import type { BarData } from "../display/widgets";
import { gpm } from "../../../functions";
import { calculateCogs } from "..";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { useSubMarginActions } from "../hooks/useSubMarginActions";

interface TotalsHeaderProps {
  barData: BarData[];
}

const TotalsHeader = ({ barData }: TotalsHeaderProps) => {
  const ctx = useSubMarginCtx();
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const { assignedStores } = useAppSelector((state) => state.user);

  const sales = barData.reduce((acc, data) => acc + data.sales, 0);
  const tax = barData.reduce((acc, data) => acc + data.tax, 0);
  const qty = barData.reduce((acc, data) => acc + data.qty, 0);
  const totalCogs = ctx.margins.reduce(
    (acc, curr) =>
      acc +
      calculateCogs(
        curr.net_cost,
        curr.cost,
        curr.case_size,
        curr.qty,
        curr.weight,
      ),
    0,
  );
  const margin = gpm(sales, totalCogs);

  const startDate = barData[0].date;
  const endDate = barData[barData.length - 1].date;

  const handleAllDates = () => {
    if (ctx.viewDaily && ctx.mobileMainView === "overview") {
      dispatch(actions.setMobileMainView("items"));
      dispatch(actions.setSelectedWeekDay(""));
    }
  };

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
    <div
      className="text-[13px] pb-2 px-2 grid grid-cols-2 bg-custom-white rounded-lg shadow-md"
      onClick={handleAllDates}
    >
      <div>
        <div className="font-medium">{findStoreName()}</div>
        <div className="font-medium">{findSubDeptName()}</div>
        <div className="flex gap-1.5">
          <div className="text-content/85">Sales:</div>
          <div className="font-medium">{formatCurrency2(sales)}</div>
        </div>
        <div className="flex gap-1.5">
          <div className="text-content/85">Qty:</div>
          <div className="font-medium">{formatBigNumber(qty, 0)}</div>
        </div>
      </div>
      <div className="">
        <div className="text-right font-medium">
          {startDate} - {endDate}
        </div>
        <div className="flex gap-1.5 justify-end">
          <div className="text-content/85">Tax:</div>
          <div className="font-medium">{formatCurrency2(tax)}</div>
        </div>
        <div className="flex gap-1.5 justify-end">
          <div className="text-content/85">COGS:</div>
          <div className="font-medium">{formatCurrency2(totalCogs)}</div>
        </div>
        <div className="flex gap-1.5 justify-end">
          <div className="text-content/85">GPM:</div>
          <div className="font-medium">{margin}</div>
        </div>
      </div>
    </div>
  );
};

export default TotalsHeader;
