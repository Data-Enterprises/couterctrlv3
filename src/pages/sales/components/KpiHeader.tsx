import { useAppSelector } from "../../../hooks";
import TotalsBar from "./TotalsBar";
import TopTotals from "./TopTotals";
import TopCoupons from "./TopCoupons";
import HourlyGrid from "../charts/HourlyGrid";

const KpiHeader = () => {
  const isTablet = useAppSelector((state) => state.app.isTablet);

  if (isTablet) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <TopTotals />
        <TopCoupons />
        {/* <div className="col-span-2 min-h-[200px]">
        </div> */}
          <TotalsBar />
          <HourlyGrid />
      </div>
    );
  }
  return (
    <div className="grid md:grid-cols-[34%_34%_1fr] gap-2 py-2 md:py-0">
      <TopTotals />
      <TopCoupons />
      <TotalsBar />
    </div>
  );
};

export default KpiHeader;
