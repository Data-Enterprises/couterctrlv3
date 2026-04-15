import { useAppSelector } from "../../../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const TopCoupons = () => {
  const sales = useAppSelector((state) => state.sales);

  const aggFunc = () => {
    // ned to use hourlySales to get avg_basket_size, total sales, total tax and subSales for total cpn dollars
    const totals = sales.subSales.reduce(
      (acc, val) => {
        acc.digital_coupons += val.digital_coupons;
        acc.elec_instore_coupons += val.elec_instore_coupons;
        acc.elect_store_coupons += val.elec_store_coupons;
        acc.store_coupon += val.store_coupon;
        return acc;
      },
      {
        digital_coupons: 0,
        elec_instore_coupons: 0,
        elect_store_coupons: 0,
        store_coupon: 0
      },
    );

    return totals;
  };

  return (
    <div className="grid grid-cols-2 gap-2 text-[13.5px]">
      <TopTotalsKpi data={aggFunc().store_coupon} title="Store Cpns" />
      <TopTotalsKpi data={aggFunc().digital_coupons} title="Digital Cpns" />
      <TopTotalsKpi data={aggFunc().elect_store_coupons} title="E. Store Cpns" />
      <TopTotalsKpi data={aggFunc().elec_instore_coupons} title="E. In-Store Cpns" />
    </div>
  );
};

export default TopCoupons;

interface TopTotalsKpiProps {
  data: number;
  title: string;
}
const TopTotalsKpi = ({ data, title }: TopTotalsKpiProps) => {
  return (
    <div className="bg-custom-white rounded-lg shadow-lg pl-1 flex justify-center items-center flex-col gap-2 relative py-2 md:py-0">
      <div className="font-medium text-content/60">{title}</div>
      {title === "Total Transactions" ? (
        <div className="font-medium">{formatBigNumber(data, 0)}</div>
      ) : (
        <div className="font-medium">{formatCurrency2(data)}</div>
      )}
    </div>
  );
};
