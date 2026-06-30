import { useSalesState } from "../hooks/useSalesState";
import type { WeekTotal } from "../../../features/salesSlice";
// import { useAppSelector } from "../../../hooks";
import TotalsGridLvlOneTablet from "./TotalsGridLvlOneTablet";

const TotalsGridTablet = () => {
  const sales = useSalesState();

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

    const atsTotalSales = data.reduce((acc, weekGroup) => {
      return (
        acc +
        weekGroup.reduce((weekAcc, week) => weekAcc + week.atsTotalSales, 0)
      );
    }, 0) / data.reduce((acc, weekGroup) => acc + weekGroup.length, 0);

    return { tyTotalSales, lyTotalSales, percentChange, dollarChange, atsTotalSales };
  }

  return (
    <div className="">
      <div className="bg-custom-white rounded-b-lg shadow-lg">
        <div className="bg-custom-white rounded-lg shadow-lg px-2 pb-2">
          {sales.uniqueSubs.map((sub, idx) => {
            const subId = sub.id;
            const desc = sub.desc;

            const filtered = sales.tyReducedTotals
              .filter((wg) => wg[0][0].subDept === subId)
              .flat();

            const totals = calcTotals(filtered);
            return (
              <TotalsGridLvlOneTablet
                key={idx}
                desc={desc}
                totals={totals}
                filtered={filtered}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TotalsGridTablet;
