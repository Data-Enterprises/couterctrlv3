import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import { CurrencyDollarIcon } from "@heroicons/react/20/solid";

const TopTotals = () => {
    const sales = useAppSelector((state) => state.sales);

    const aggFunc = () => {
      // ned to use hourlySales to get avg_basket_size, total sales, total tax and subSales for total cpn dollars
      const totals = sales.hourlySales.reduce(
        (acc, val) => {
          acc.avg_basket_amount += val.basket_size_sales;
          acc.total_tax += val.total_tax;
          acc.total_sales += val.total_sales;
          return acc;
        },
        {
          total_sales: 0,
          total_tax: 0,
          total_cpn_dollars: 0,
          avg_basket_amount: 0,
        },
      );

      const addCpnDollars = sales.subSales.reduce((acc, val) => {
        acc.total_cpn_dollars +=
          val.digital_coupons +
          val.elec_instore_coupons +
          val.elec_store_coupons +
          val.store_coupon;
        return acc;
      }, totals);

      return addCpnDollars;
    };

    const classStr =
      "bg-custom-white rounded-lg shadow-lg pl-1 flex justify-center items-center flex-col gap-2 relative";
  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className={classStr}>
        <CurrencyDollarIcon className="h-10 w-10 text-emerald-500 absolute left-1" />
        <div className="font-medium text-content/60">Total Sales $</div>
        <div className="font-medium">
          {formatCurrency2(aggFunc().total_sales)}
        </div>
      </div>
      <div className={classStr}>
        <CurrencyDollarIcon className="h-10 w-10 text-emerald-500 absolute left-1" />
        <div className="font-medium text-content/60">Total Tax $</div>
        <div className="font-medium">
          {formatCurrency2(aggFunc().total_tax)}
        </div>
      </div>
      <div className={classStr}>
        <CurrencyDollarIcon className="h-10 w-10 text-emerald-500 absolute left-1" />
        <div className="font-medium text-content/60">Avg Basket $</div>
        <div className="font-medium">
          {formatCurrency2(aggFunc().avg_basket_amount)}
        </div>
      </div>
      <div className={classStr}>
        <CurrencyDollarIcon className="h-10 w-10 text-emerald-500 absolute left-1" />
        <div className="font-medium text-content/60">Total Cpn $</div>
        <div className="font-medium">
          {formatCurrency2(aggFunc().total_cpn_dollars)}
        </div>
      </div>
    </div>
  );
};

export default TopTotals;
