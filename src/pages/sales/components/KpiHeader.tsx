// import TopSubDept from "./TopSub";
import TotalsBar from "./TotalsBar";
import TopTotals from "./TopTotals";
import TopCoupons from "./TopCoupons";

const KpiHeader = () => {
  return (
    <div className="grid md:grid-cols-[1fr_35%_35%] gap-2 py-2 md:py-0 h-[9.5rem]">
      <TotalsBar />
      <TopTotals />
      <TopCoupons />
      {/* <TopSubDept /> */}
    </div>
  );
};

export default KpiHeader;
