import { useAppSelector } from "../../../hooks";
import TopSubDept from "../graphs/TopSub";
import TotalsBar from "../graphs/TotalsBar";
import TopTotals from "../graphs/TopTotals";
import TopCoupons from "../graphs/TopCoupons";
import SubDeptGrid from "../charts/SubDeptGrid";

const KpiHeader = () => {
  const { isMobile } = useAppSelector((state) => state.app);

  return (
    <div className="grid md:grid-cols-4 gap-2 py-2 md:py-0">
      <TopTotals />
      <TopCoupons />
      <TotalsBar valueKey="total_sales" />
      {isMobile && <SubDeptGrid />}
      <TopSubDept />
    </div>
  );
};

export default KpiHeader;
