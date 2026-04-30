import { type WeekTotal } from "../../../features/salesSlice";
import { useAppSelector } from "../../../hooks";
import TotalsGridLvlOne from "./TotalsGridLvlOne";

const TotalsGrid = () => {
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
    <div className="h-full w-full rounded-lg shadow-lg grid grid-cols-[54%_45%] gap-3">
      <div>
        <div className="bg-custom-white rounded-t-lg shadow-lg">
          <div className="grid grid-cols-[1.3fr_1.1fr_1.1fr_1fr_0.7fr_0.8fr] font-bold text-content/60 text-sm px-2">
            <div>Sub Dept</div>
            <div className="text-right">TY Sales</div>
            <div className="text-right">LY Sales</div>
            <div className="text-right">ATS Sales</div>
            <div className="text-right">$ Change</div>
            <div className="text-right">% Change</div>
          </div>
          <div className="mt-1 border-b border-content/60 mx-2"></div>
        </div>
        <div className="grid bg-custom-white rounded-b-lg shadow-lg max-h-[81%] overflow-auto no-scrollbar">
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
                subId={subId}
              />
            );
          })}
        </div>
      </div>

      <div className="max-h-[84.1%] overflow-auto no-scrollbar">
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
    </div>
  );
};

export default TotalsGrid;
