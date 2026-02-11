import type { ItemLookup } from "../../features/itemLookupSlice";
import { useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import { formatCurrency2 } from "../../utils";

const BottomStoreLookup = () => {
  const { lowestStoreSales, lowestStoreQty, lowestPriceStore, mode } =
    useAppSelector((state) => state.item);
  const [item, setItem] = useState<ItemLookup>(lowestStoreSales!);

  useEffect(() => {
    if (mode === "Sales") {
      setItem(lowestStoreSales!);
    } else if (mode === "Qty") {
      setItem(lowestStoreQty!);
    } else {
      // mode === "Price"
      setItem(lowestPriceStore!);
    }
  }, [mode, lowestStoreSales, lowestStoreQty, lowestPriceStore]);

  return (
    <div className="text-sm mb-4 bg-custom-white rounded-lg shadow-md pb-2">
      {/* Details */}
      <div className="">
        <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-1 px-2 flex justify-between">
          <div>Highest {mode}</div>
          <div>
            {item.store_name} ({item.store_number})
          </div>
        </div>
        <div className="px-2 py-1">
          <div className="text-content/60">Category:</div>
          <div className="font-medium">{item.category_description}</div>
        </div>
      </div>
      {/* cost columns */}
      <div className="grid grid-cols-2 gap-4 mb-1 mx-2">
        <div className="">
          <div className="text-content/60">Case cost:</div>
          <div className="font-medium">
            ${item.casecost ? item.casecost.toFixed(2) : "N/A"}
          </div>
        </div>
        <div className="">
          <div className="text-content/60">Extended cost:</div>
          <div className="font-medium">
            ${item.extended_cost ? item.extended_cost.toFixed(2) : "N/A"}
          </div>
        </div>
      </div>

      {/* Totals qty/sales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="mx-2">
          <div className="text-content/60">Price:</div>
          <div className="font-medium">{formatCurrency2(item.price)}</div>
        </div>
        <div className="mx-2">
          <div className="text-content/60">Qty:</div>
          <div className="font-medium">{item.qty}</div>
        </div>
        <div className="mx-2">
          <div className="text-content/60">Sales:</div>
          <div className="font-medium">{formatCurrency2(item.total_sales)}</div>
        </div>
      </div>
    </div>
  );
};

export default BottomStoreLookup;
