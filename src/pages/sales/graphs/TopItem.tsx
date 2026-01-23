import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import { type TopTenItem } from "../../../interfaces";

const TopItem = () => {
  const [topItem, setTopItem] = useState<TopTenItem | null>(null);
  const { topTenItems, selectedSalesPanel } = useAppSelector(
    (state) => state.sales,
  );

  useEffect(() => {
    if (topTenItems.length === 0) {
      setTopItem(null);
      return;
    }

    let item = null;
    if (!selectedSalesPanel.storeid) {
      // not selected
      item = [...topTenItems].sort((a, b) => b.total_sales - a.total_sales)[0];
    } else {
      // selected
      const filtered = topTenItems.filter(
        (item) => item.storeid === selectedSalesPanel.storeid,
      );
      item = [...filtered].sort((a, b) => b.total_sales - a.total_sales)[0];
    }

    setTopItem(item);
  }, [topTenItems, selectedSalesPanel]);

  return (
    <div className="bg-custom-white rounded-lg shadow-lg">
      {topItem ? (
        <>
          <div className="bg-blue-500 text-custom-white px-2 rounded-t-lg font-medium flex justify-between">
            Top Item
            <div className="font-semibold">{topItem.product_code}</div>
          </div>

          <div className="text-sm select-none">

          </div>
        </>
      ) : null}
    </div>
  );
};

export default TopItem;
