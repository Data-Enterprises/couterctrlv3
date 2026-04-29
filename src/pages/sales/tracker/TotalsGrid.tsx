// import { useEffect, useState } from "react";
import {
  setSalesTrackerSelectedSubDept,
  type WeekTotal,
} from "../../../features/salesSlice";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import TotalsGridLvlOne from "./TotalsGridLvlOne";

const TotalsGrid = () => {
  const dispatch = useAppDispatch();
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

    const atsTotalSales =
      data.reduce((acc, weekGroup) => {
        return (
          acc +
          weekGroup.reduce((weekAcc, week) => weekAcc + week.atsTotalSales, 0)
        );
      }, 0) / data.reduce((acc, weekGroup) => acc + weekGroup.length, 0);

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
    <div className="h-full w-full rounded-lg shadow-lg">
      <div className="flex flex-wrap gap-x-2 gap-y-1 bg-custom-white p-2 rounded-t-lg">
        <div
          className={`px-2 text-[9px] rounded-full border border-content/25 cursor-pointer hover:shadow-inner hover:bg-bkg ${sales.salesTrackerSelectedSubDept === 0 ? "bg-orange-200" : "bg-bkg/75"} transition-all duration-200`}
          onClick={() => dispatch(setSalesTrackerSelectedSubDept(0))}
        >
          All Subs
        </div>
        {sales.uniqueSubs.map((sub, idx) => {
          return (
            <div
              key={idx}
              className={`px-2 text-[9px] rounded-full border border-content/25 cursor-pointer hover:shadow-inner hover:bg-bkg ${sales.salesTrackerSelectedSubDept === sub.id ? "bg-orange-200" : "bg-bkg/75"} transition-all duration-200`}
              onClick={() => dispatch(setSalesTrackerSelectedSubDept(sub.id))}
            >
              {sub.desc}
            </div>
          );
        })}
      </div>
      {sales.salesTrackerSelectedSubDept === 0 ? (
        <div className="grid grid-cols-5 gap-2  bg-custom-white rounded-b-lg shadow-lg max-h-[82%] px-2 pb-2 overflow-auto no-scrollbar">
          {sales.uniqueSubs.map((sub, idx) => {
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
                filtered={filtered}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-custom-white rounded-b-lg shadow-lg max-h-[82%] overflow-auto no-scrollbar px-2 pb-2">
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
