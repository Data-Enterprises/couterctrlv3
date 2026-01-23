import TopItem from "../graphs/TopItem";
import TopSubDept from "../graphs/TopSub";
import TotalsBar from "../graphs/TotalsBar";

const KpiHeader = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <TotalsBar valueKey="total_sales" />
      <TotalsBar valueKey="qty" />
      <TopSubDept />
      <TopItem />
    </div>
  );
};

export default KpiHeader;
