import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import type { SubSale } from "../../../interfaces";

const TopSub = () => {
  const [topSub, setTopSub] = useState<SubSale | null>(null);
  const { subSales, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );

  useEffect(() => {
    if (!selectedSalesPanel.storeid) {
      // find the top sub of all sub sales
    } else {
      // sales panel is selected so show the top sub for that store
      const sub = subSales.filter(
        (sub) => sub.storeid === selectedSalesPanel.storeid,
      ).sort((a, b) => b.total_sales - a.total_sales)[0];
      console.log("sub:", sub);
      console.log(subSales);
      console.log(selectedSalesPanel)
    }
  }, [subSales, selectedSalesPanel]);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg flex justify-center items-center">
      Top Sub
    </div>
  );
};

export default TopSub;
