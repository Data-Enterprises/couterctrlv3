import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const TopTotals = () => {
  const sales = useAppSelector((state) => state.sales);

  const aggFunc = () => {
    const p = sales.selectedSalesPanel;
    const filtered = [...sales.hourlySales].filter((hs) => {
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
      if (p.sale_date) {
        // find that sales panel => total sales - total tax => yyyy-mm-dd
        const panel = sales.salesPanels.find((sp) => sp.sale_date.split("T")[0] === p.sale_date);
        return panel!.total_sales - panel!.total_tax;
      } else {
        // all panels
        return [...sales.salesPanels].reduce((acc, cur) => {
          acc += cur.total_sales - cur.total_tax;
          return acc;
        }, 0);
      }
    };

    totals.total_sales = formatSales();
    totals.avg_basket_amount = totals.total_sales / totals.transactions;
    
    return totals;
  };

  return (
    <div className="grid grid-cols-2 gap-2 text-[13.5px]">
      <TopTotalsKpi data={aggFunc().total_sales} title="Net Sales" />
      <TopTotalsKpi data={aggFunc().transactions} title="Total Trans" />
      <TopTotalsKpi data={aggFunc().avg_basket_amount} title="Avg Basket" />
      <TopTotalsKpi data={aggFunc().total_tax} title="Total Tax" />
    </div>
  );
};

export default TopTotals;

interface TopTotalsKpiProps {
  data: number;
  title: string;
}
const TopTotalsKpi = ({ data, title }: TopTotalsKpiProps) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-lg pl-1 flex justify-center items-center flex-col gap-2 relative py-2 md:py-0">
      <div className="font-medium text-content/60">{title}</div>
      {title === "Total Trans" ? (
        <div className="font-medium">{formatBigNumber(data, 0)}</div>
      ) : (
        <div className="font-medium">{formatCurrency2(data)}</div>
      )}
    </div>
  );
};
