import TotalsBar from "./TotalsBar";
import TopTotals from "./TopTotals";
import TopCoupons from "./TopCoupons";

const KpiHeader = () => {
  return (
    <div className="grid md:grid-cols-[34%_34%_1fr] gap-2 py-2 md:py-0">
      <TopTotals />
      <TopCoupons />
      <TotalsBar />
    </div>
  );
};

export default KpiHeader;
