import TopSub from "../graphs/TopSub";
import TotalsBar from "../graphs/TotalsBar";

const KpiHeader = () => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <TotalsBar valueKey="total_sales" />
      <TotalsBar valueKey="qty" />
      <TopSub />
      <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
        Top Item
      </div>
    </div>
  );
};

export default KpiHeader;
