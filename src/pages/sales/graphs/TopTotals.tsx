import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
// import { CurrencyDollarIcon } from "@heroicons/react/20/solid";

const TopTotals = () => {
  const sales = useAppSelector((state) => state.sales);

  const aggFunc = () => {
    // ned to use hourlySales to get avg_basket_size, total sales, total tax and subSales for total cpn dollars
    const totals = sales.hourlySales.reduce(
      (acc, val) => {
        acc.basket_size_sales += val.basket_size_sales;
        acc.total_tax += val.total_tax;
        acc.total_sales += val.total_sales - val.total_tax;
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

    totals.avg_basket_amount = totals.total_sales / totals.transactions;
    return totals;
  };

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <TopTotalsKpi data={aggFunc().total_sales} title="Total Sales" />
      <TopTotalsKpi data={aggFunc().transactions} title="Total Transactions" />
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
    <div className="bg-custom-white rounded-lg shadow-lg pl-1 flex justify-center items-center flex-col gap-2 relative">
      <div className="font-medium text-content/60">{title}</div>
      {title === "Total Transactions" ? (
        <div className="font-medium">{formatBigNumber(data, 0)}</div>
      ) : (
        <div className="font-medium">{formatCurrency2(data)}</div>
      )}
    </div>
  );
};
