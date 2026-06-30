import { useSalesState } from "../hooks/useSalesState";
import { sameWeekDayLastYear } from "../../../utils";
import TopTotalsKpi from "./TopTotalsKpi";

const TopCoupons = () => {
  const sales = useSalesState();

  const aggFunc = (thisYear: boolean = true) => {
    const data = thisYear ? [...sales.subSales] : [...sales.subSalesWk3];
    const p = sales.selectedSalesPanel;
    if (data.length === 0) {
      return {
        digital_coupons: 0,
        elec_instore_coupons: 0,
        elect_store_coupons: 0,
        store_coupon: 0,
      };
    }

    const dateComp = thisYear
      ? p.sale_date
      : p.sale_date.length
        ? sameWeekDayLastYear(p.sale_date).date
        : "";

        const filtered = data.filter((sub) => {
          return p.sale_date.length
            ? sub.sale_date.split("T")[0] === dateComp
            : true;
        });

    // ned to use hourlySales to get avg_basket_size, total sales, total tax and subSales for total cpn dollars
    const totals = filtered.reduce(
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
        store_coupon: 0,
      },
    );

    return totals;
  };

  const ty = aggFunc(true);
  const ly = aggFunc(false);

  return (
    <div className="grid grid-cols-2 gap-2 text-[13.5px]">
      <TopTotalsKpi
        tyData={ty.store_coupon}
        lyData={ly.store_coupon}
        title="Store Cpns"
      />
      <TopTotalsKpi
        tyData={ty.digital_coupons}
        lyData={ly.digital_coupons}
        title="Digital Cpns"
      />
      <TopTotalsKpi
        tyData={ty.elect_store_coupons}
        lyData={ly.elect_store_coupons}
        title="E. Store Cpns"
      />
      <TopTotalsKpi
        tyData={ty.elec_instore_coupons}
        lyData={ly.elec_instore_coupons}
        title="E. In-Store Cpns"
      />
    </div>
  );
};

export default TopCoupons;
