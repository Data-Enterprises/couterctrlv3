import { useState } from "react";
import { type WeekTotal } from "../../../features/salesSlice";
import { useAppSelector } from "../../../hooks";
import TotalsGridLvlOne from "./TotalsGridLvlOne";

const TotalsGrid = () => {
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const sales = useAppSelector((state) => state.sales);

  if (sales.tyReducedTotals.length === 0) {
    return null;
  }

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

    const totalTrans = data.reduce((acc, weekGroup) => {
      return (
        acc +
        weekGroup.reduce((weekAcc, week) => weekAcc + week.transaction_count, 0)
      );
    }, 0);

    const atsTotalSales = tyTotalSales / totalTrans;

    return {
      tyTotalSales,
      lyTotalSales,
      percentChange,
      dollarChange,
      atsTotalSales,
    };
  };

  const filteredSubs = () => {
    if (sales.salesTrackerSelectedSubDept === 0) {
      return sales.uniqueSubs;
    }
    return [...sales.uniqueSubs].filter(
      (sub) => sub.id === sales.salesTrackerSelectedSubDept,
    );
  };

  return (
    <div className="h-full w-full rounded-lg grid grid-cols-[54.5%_45%] gap-2">
      <div className="">
        {/* Header row */}
        <div className="bg-custom-white rounded-t-lg shadow">
          <div className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1fr_0.7fr_0.8fr] font-bold text-content/70 text-sm px-2 py-1">
            <div>Sub Dept</div>
            <div className="text-right">TY Sales</div>
            <div className="text-right">LY Sales</div>
            <div
              className={`text-right relative hover:text-orange-200 `}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              ATS Sales
              <div className={`pointer-events-none ${isHovering ? "absolute text-[10px] text-content font-medium text-nowrap top-0 -translate-y-5 translate-x-[5%] bg-orange-200 px-2 rounded-md shadow-md animate-windowIn" : "hidden"}`}>
                ATS: Average Transaction Size
              </div>
            </div>
            <div className="text-right">$ vs LY</div>
            <div className="text-right">% vs LY</div>
          </div>
          <div className="border-b border-content/40 mx-2"></div>
        </div>

        {/* Scrollable body */}
        <div className="rounded-b-lg shadow-lg max-h-[calc(100vh-180px)] overflow-y-auto no-scrollbar pb-1">
          {sales.uniqueSubs.map((sub, idx) => {
            const subId = sub.id;
            const desc = sub.desc;

            const filtered = sales.tyReducedTotals
              .filter((wg) => wg[0][0].subDept === subId)
              .flat();

            const totals = calcTotals(filtered);
            const isLast = idx === sales.uniqueSubs.length - 1;
            return (
              <TotalsGridLvlOne
                key={idx}
                desc={desc}
                totals={totals}
                filtered={filtered}
                subId={subId}
                isLast={isLast}
              />
            );
          })}
        </div>
      </div>

      {sales.salesTrackerSelectedSubDept > 0 && (
        <div className="max-h-[calc(100vh-152px)] overflow-auto no-scrollbar pb-1">
          {filteredSubs().map((sub, idx) => {
            const subId = sub.id;
            const desc = sub.desc;

            const filtered = sales.tyReducedTotals
              .filter((wg) => wg[0][0].subDept === subId)
              .flat();

            const totals = calcTotals(filtered);
            return (
              <TotalsGridLvlOne
                key={idx}
                desc={desc}
                totals={totals}
                isLvlTwo={true}
                filtered={filtered}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TotalsGrid;
