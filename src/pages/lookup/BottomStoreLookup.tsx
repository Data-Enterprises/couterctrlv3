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
    } else if (mode === "Price") {
      setItem(lowestPriceStore!);
    }
  }, [mode, lowestStoreSales, lowestStoreQty, lowestPriceStore]);

  return (
    <div className="text-sm">
      {/* Details */}
      <div className="bg-custom-white shadow-md rounded-lg mb-2">
        <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-0.5 px-2 flex justify-between">
          <div>Lowest {mode}</div>
          <div>
            {item.store_name} ({item.store_number})
          </div>
        </div>
        {/* <div className="pl-2 py-0.5 flex gap-2">
          <div className="font-medium">Store:</div>
          <div>
            {item.store_name} ({item.store_number})
          </div>
        </div> */}
        <div className="pl-2 py-0.5 flex gap-2">
          <div className="font-medium">Category:</div>
          <div>{item.category_description}</div>
        </div>
      </div>
      {/* cost columns */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Case cost:
          </div>
          <div className="pl-2 py-1">
            {item.casecost ? formatCurrency2(item.casecost) : "N/A"}
          </div>
        </div>
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Extended cost:
          </div>
          <div className="pl-2 py-1">
            {item.extended_cost ? formatCurrency2(item.extended_cost) : "N/A"}
          </div>
        </div>
      </div>

      {/* Totals qty/sales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Price:
          </div>
          <div className="pl-2 py-1">{formatCurrency2(item.price)}</div>
        </div>
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Qty:
          </div>
          <div className="pl-2 py-1">{item.qty}</div>
        </div>
        <div className="bg-custom-white shadow-md rounded-lg">
          <div className="font-medium bg-orange-500 text-custom-white rounded-t-lg py-0.5 pl-2">
            Sales:
          </div>
          <div className="pl-2 py-1">{formatCurrency2(item.total_sales)}</div>
        </div>
      </div>
    </div>
  );
};

export default BottomStoreLookup;
