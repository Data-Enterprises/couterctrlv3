import { useAppDispatch, useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import {
  setSalesTrackerSelectedSubDept,
  type WeekTotal,
} from "../../../features/salesSlice";
import { changeTextColor } from ".";
import TotalsGridLvlTwo from "./TotalsGridLvlTwo";

interface TotalsGridLvlOneProps {
  desc: string;
  totals: {
    tyTotalSales: number;
    lyTotalSales: number;
    percentChange: number;
    dollarChange: number;
    atsTotalSales: number;
  };
  filtered: WeekTotal[][];
  isLvlTwo?: boolean;
  subId?: number;
}

const TotalsGridLvlOne = ({
  desc,
  totals,
  filtered,
  isLvlTwo = false,
  subId,
}: TotalsGridLvlOneProps) => {
  const { salesTrackerSelectedSubDept } = useAppSelector(
    (state) => state.sales,
  );
  const dispatch = useAppDispatch();
  const calcTotals = (data: WeekTotal[][]) => {
    const tyTotalSales = data.reduce((acc, weekGroup) => {
      return (
        acc + weekGroup.reduce((weekAcc, week) => weekAcc + week.salesTY, 0)
      );
    }, 0);

    const lyTotalSales = data.reduce((acc, weekGroup) => {
      return (
        acc + weekGroup.reduce((weekAcc, week) => weekAcc + week.salesLY, 0)
      );
    }, 0);

    const percentChange =
      lyTotalSales === 0
        ? 0
        : ((tyTotalSales - lyTotalSales) / lyTotalSales) * 100;
    const dollarChange = tyTotalSales - lyTotalSales;

    return { tyTotalSales, lyTotalSales, percentChange, dollarChange };
  };

  const handleRowClick = () => {
    if (subId !== undefined) {
      dispatch(setSalesTrackerSelectedSubDept(subId));
    }
  };

  if (!isLvlTwo) {
    return (
      <div
        className={`text-[13px] transition-all duration-200 ${salesTrackerSelectedSubDept === subId ? "bg-orange-200 shadow-inner" : ""}`}
        onClick={handleRowClick}
      >
        <div className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1fr_0.7fr_0.8fr] px-2 py-1 font-medium items-center cursor-pointer hover:bg-blue-200/50 transition-all duration-200">
          <div className="flex gap-1 items-center">
            <div className="">{desc}</div>
          </div>
          <div className="text-right">
            {formatCurrency2(totals.tyTotalSales)}
          </div>
          <div className="text-right">
            {formatCurrency2(totals.lyTotalSales)}
          </div>
          <div className="text-right">
            {formatBigNumber(totals.atsTotalSales, 2)}
          </div>
          <div
            className={`text-right ${changeTextColor(totals.dollarChange, 0)}`}
          >
            {formatCurrency2(totals.dollarChange)}
          </div>
          <div
            className={`text-right ${changeTextColor(totals.percentChange, 0)}`}
          >
            {totals.percentChange.toFixed(2)}%
          </div>
        </div>
        <div className="border-b border-content/15"></div>
      </div>
    );
  }

  /* Level 2 => weeks */
  return (
    <div className="">
      <div
        data-display="closed"
        className="grid gap-2"
        // className="grid grid-cols-3 gap-2"
      >
        {filtered.map((week, widx) => {
          const desc = week[0].subDesc;
          const weekTotals = calcTotals([week]);
          return (
            <TotalsGridLvlTwo
              key={widx}
              idx={widx + 1}
              week={week}
              weekTotals={weekTotals}
              desc={desc}
            />
          );
        })}
      </div>
    </div>
  );
};

export default TotalsGridLvlOne;
