// import TopItem from "../graphs/TopItem";
import TopSubDept from "../graphs/TopSub";
import TotalsBar from "../graphs/TotalsBar";
import TopTotals from "../graphs/TopTotals";
import TopCoupons from "../graphs/TopCoupons";

const KpiHeader = () => {
  return (
    <div className="grid md:grid-cols-4 gap-2 py-2">
      <TopTotals />
      <TopCoupons />
      <TotalsBar valueKey="total_sales" />
      <TopSubDept />
    </div>
  );
};

export default KpiHeader;
