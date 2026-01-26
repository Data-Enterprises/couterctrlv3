import TopItem from "../graphs/TopItem";
import TopSubDept from "../graphs/TopSub";
import TotalsBar from "../graphs/TotalsBar";
import TopTotals from "../graphs/TopTotals";

const KpiHeader = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <TopTotals />
      <TotalsBar valueKey="total_sales" />
      <TopSubDept />
      <TopItem />
    </div>
  );
};

export default KpiHeader;
