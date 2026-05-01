import { useMobileSalesCtx } from "../hooks";
// import type { WeekTotal } from "../../../../features/salesSlice";

import ReducedTotalsHeader from "./ReducedTotalsHeader";
import WeekDayMobile from "./WeekDayMobile";

const SalesTrackerDays = () => {
  const ctx = useMobileSalesCtx();

  const filteredSubs = () => {
    if (ctx.salesTrackerSelectedSubDept === 0) {
      return ctx.uniqueSubsMobile;
    }
    return [...ctx.uniqueSubsMobile].filter(
      (sub) => sub.id === ctx.salesTrackerSelectedSubDept,
    );
  };

  // const calcTotals = (data: WeekTotal[][]) => {
  //   const tyTotalSales = data.reduce((acc, weekGroup) => {
  //     return (
  //       acc + weekGroup.reduce((weekAcc, week) => weekAcc + week.salesTY, 0)
  //     );
  //   }, 0);

  //   const lyTotalSales = data.reduce((acc, weekGroup) => {
  //     return (
  //       acc + weekGroup.reduce((weekAcc, week) => weekAcc + week.salesLY, 0)
  //     );
  //   }, 0);

  //   const percentChange =
  //     lyTotalSales === 0
  //       ? 0
  //       : ((tyTotalSales - lyTotalSales) / lyTotalSales) * 100;
  //   const dollarChange = tyTotalSales - lyTotalSales;
  //   const totalTrans = data.reduce((acc, weekGroup) => {
  //     return (
  //       acc +
  //       weekGroup.reduce((weekAcc, week) => weekAcc + week.transaction_count, 0)
  //     );
  //   }, 0);
  //   const atsTotalSales = totalTrans === 0 ? 0 : tyTotalSales / totalTrans;

  //   return {
  //     tyTotalSales,
  //     lyTotalSales,
  //     percentChange,
  //     dollarChange,
  //     atsTotalSales,
  //   };
  // };

  return (
    <div className="flex flex-col w-full h-[calc(100vh-90px)] max-h-[calc(100vh-90px)] px-3 py-2 space-y-2">
      <ReducedTotalsHeader />
      <div className="flex-1 w-full grid overflow-y-hidden">
        <div className="flex flex-col overflow-y-auto space-y-2">
          {filteredSubs().map((sub) => {
            const subId = sub.id;
            const desc = sub.desc;

            const filteredBySub = ctx.tyReducedTotalsMobile
              .filter((wg) => wg[0][0].subDept === subId)
              .flat();

            return filteredBySub.map((week, idx) => {
              return (
                <WeekDayMobile key={idx} week={week} desc={desc} idx={idx} />
              );
            });
          })}
        </div>
      </div>
    </div>
  );
};

export default SalesTrackerDays;
