import { useAppSelector } from "../../../hooks";
import TopTotalsKpi from "./TopTotalsKpi";

const TopTotals = () => {
  const sales = useAppSelector((state) => state.sales);

  const aggFunc = (thisYear: boolean = true) => {
    const p = sales.selectedSalesPanel;
    const data = thisYear
      ? [...sales.hourlySales]
      : [...sales.hourlySalesLastYear];

    const filtered = data.filter((hs) => {
      return p.sale_date ? hs.sale_date.split("T")[0] === p.sale_date : true;
    });

    const totals = filtered.reduce(
      (acc, val) => {
        acc.basket_size_sales += val.basket_size_sales;
        acc.total_tax += val.total_tax;
        acc.transactions += val.transactions;
        return acc;
      },
      {
        total_sales: 0,
        total_tax: 0,
        total_cpn_dollars: 0,
        basket_size_sales: 0,
        transactions: 0,
        avg_basket_amount: 0,
      },
    );

    // all needed panels or just the selected panel sale date
    const formatSales = () => {
      const panels = thisYear ? sales.weeklySales : sales.weeklySalesLastYear
      if (p.sale_date) {
        // find that sales panel => total sales - total tax => yyyy-mm-dd
        const panel = panels.find(
          (sp) => sp.sale_date.split("T")[0] === p.sale_date,
        );
        return panel!.total_sales - panel!.total_tax;
      } else {
        // all panels
        return [...panels].reduce((acc, cur) => {
          acc += cur.total_sales - cur.total_tax;
          return acc;
        }, 0);
      }
    };

    totals.total_sales = formatSales();
    totals.avg_basket_amount = totals.total_sales / totals.transactions;

    return totals;
  };

  const ty = aggFunc(true);
  const ly = aggFunc(false);

  return (
    <div className="grid grid-cols-2 gap-2 text-[13.5px]">
      <TopTotalsKpi
        tyData={ty.total_sales}
        lyData={ly.total_sales}
        title="Net Sales"
      />
      <TopTotalsKpi
        tyData={ty.transactions}
        lyData={ly.transactions}
        title="Total Trans"
      />
      <TopTotalsKpi
        tyData={ty.avg_basket_amount}
        lyData={ly.avg_basket_amount}
        title="Avg Basket"
      />
      <TopTotalsKpi
        tyData={ty.total_tax}
        lyData={ly.total_tax}
        title="Total Tax"
      />
    </div>
  );
};

export default TopTotals;
