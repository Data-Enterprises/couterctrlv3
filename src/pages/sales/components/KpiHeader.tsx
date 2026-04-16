import TopSubDept from "./TopSub";
import TotalsBar from "./TotalsBar";
import TopTotals from "./TopTotals";
import TopCoupons from "./TopCoupons";

const KpiHeader = () => {
  return (
    <div className="grid md:grid-cols-4 gap-2 py-2 md:py-0">
      <TopTotals />
      <TopCoupons />
      <TotalsBar />
      <TopSubDept />
    </div>
  );
};

export default KpiHeader;
